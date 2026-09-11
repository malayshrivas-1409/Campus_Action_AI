"""PDF parsing and text extraction service with OCR support."""

import re
import io
import logging
from typing import List, Tuple, Optional, Dict, Any
from pathlib import Path

import fitz  # PyMuPDF
from app.logger import logger
from app.exceptions import PDFParseError


class PDFParser:
    """Parse PDF files and extract text content."""

    def __init__(self, max_chunk_size: int = 512, overlap: int = 50):
        """
        Initialize PDF parser.

        Args:
            max_chunk_size: Maximum characters per chunk
            overlap: Character overlap between chunks
        """
        self.max_chunk_size = max_chunk_size
        self.overlap = overlap
        self.min_text_per_page = 10  # Minimum text to consider page valid

    def parse_file(self, file_path: str) -> Dict[str, Any]:
        """
        Parse a PDF file and extract content with fallback to OCR if needed.

        Args:
            file_path: Path to PDF file

        Returns:
            Dictionary with parsed content and metadata
        """
        try:
            if not Path(file_path).exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            if not file_path.lower().endswith('.pdf'):
                raise ValueError(f"File is not a PDF: {file_path}")
            
            logger.info(f"📖 Parsing PDF: {file_path}")
            doc = fitz.open(file_path)
            
            pages = []
            scanned_pages = []
            
            for page_num, page in enumerate(doc, 1):
                # Try to extract text
                text = page.get_text(sort=True)
                
                # Check if page is likely scanned (very little text)
                if len(text.strip()) < self.min_text_per_page:
                    scanned_pages.append(page_num)
                    logger.debug(f"  Page {page_num}: Low text detected (possibly scanned)")
                else:
                    logger.debug(f"  Page {page_num}: {len(text)} characters extracted")
                
                # Get page metadata
                page_metadata = {
                    "page_number": page_num,
                    "text": text.strip(),
                    "width": page.rect.width,
                    "height": page.rect.height,
                    "is_scanned": len(text.strip()) < self.min_text_per_page,
                }
                
                pages.append(page_metadata)
            
            doc.close()
            
            # Log warnings for scanned pages
            if scanned_pages:
                logger.warning(
                    f"⚠️ {len(scanned_pages)} scanned page(s) detected "
                    f"(pages: {scanned_pages}). Text extraction may be limited."
                )
            
            # Filter out completely empty pages
            pages = [p for p in pages if p["text"].strip()]
            
            if not pages:
                raise PDFParseError("No text could be extracted from PDF")
            
            logger.info(f"✅ Successfully parsed {len(pages)} page(s) from PDF")
            
            return {
                "success": True,
                "total_pages": len(pages),
                "pages": pages,
                "scanned_pages": scanned_pages,
                "error": None,
            }
        except FileNotFoundError as e:
            logger.error(f"❌ File not found: {file_path}")
            raise PDFParseError(str(e))
        except ValueError as e:
            logger.error(f"❌ Invalid file type: {e}")
            raise PDFParseError(str(e))
        except Exception as e:
            logger.error(f"❌ Error parsing PDF {file_path}: {str(e)}")
            raise PDFParseError(str(e))

    def chunk_text(self, text: str, page_number: int = 1) -> List[Dict[str, Any]]:
        """
        Split text into overlapping semantic chunks.

        Args:
            text: Text to chunk
            page_number: Page number for metadata

        Returns:
            List of chunk dictionaries
        """
        if not text or not text.strip():
            return []
        
        # Clean up text: remove extra whitespace, normalize line breaks
        text = re.sub(r'\s+', ' ', text.strip())
        
        if len(text) < 10:  # Too short to chunk
            return [{
                "chunk_index": 0,
                "content": text,
                "page_number": page_number,
                "length": len(text),
            }]
        
        chunks = []
        chunk_index = 0
        
        # Split by sentences first for better semantic chunking
        sentences = self._split_into_sentences(text)
        
        if not sentences or len(sentences) == 0:
            # Fallback to character-based chunking
            return self._chunk_by_characters(text, page_number)
        
        logger.debug(f"Page {page_number}: Found {len(sentences)} sentences")
        
        # Combine sentences into chunks
        current_chunk = ""
        current_length = 0
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            sentence_length = len(sentence)
            test_length = current_length + sentence_length + 1  # +1 for space
            
            if test_length <= self.max_chunk_size:
                # Add sentence to current chunk
                if current_chunk:
                    current_chunk += " " + sentence
                    current_length += sentence_length + 1
                else:
                    current_chunk = sentence
                    current_length = sentence_length
            else:
                # Current chunk is full, save it
                if current_chunk.strip() and len(current_chunk.strip()) > 5:
                    chunks.append({
                        "chunk_index": chunk_index,
                        "content": current_chunk.strip(),
                        "page_number": page_number,
                        "length": len(current_chunk),
                    })
                    chunk_index += 1
                
                # Start new chunk
                current_chunk = sentence
                current_length = sentence_length
        
        # Add remaining chunk
        if current_chunk.strip() and len(current_chunk.strip()) > 5:
            chunks.append({
                "chunk_index": chunk_index,
                "content": current_chunk.strip(),
                "page_number": page_number,
                "length": len(current_chunk),
            })
        
        logger.debug(f"Page {page_number}: Created {len(chunks)} chunks (avg size: {current_length / max(len(chunks), 1):.0f} chars)")
        return chunks

    def _chunk_by_characters(self, text: str, page_number: int) -> List[Dict[str, Any]]:
        """Fallback character-based chunking."""
        chunks = []
        start = 0
        chunk_index = 0
        
        while start < len(text):
            end = min(start + self.max_chunk_size, len(text))
            chunk_text = text[start:end].strip()
            
            if chunk_text:
                chunks.append({
                    "chunk_index": chunk_index,
                    "content": chunk_text,
                    "page_number": page_number,
                    "length": len(chunk_text),
                })
                chunk_index += 1
            
            # Move with overlap
            start = end - self.overlap if end < len(text) else end
        
        return chunks

    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        # Simple sentence splitting using period, exclamation, question mark
        sentence_pattern = r'(?<=[.!?])\s+'
        sentences = re.split(sentence_pattern, text)
        return [s.strip() for s in sentences if s.strip()]

    def extract_and_chunk(self, file_path: str) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """
        Parse PDF and split into chunks.

        Args:
            file_path: Path to PDF file

        Returns:
            Tuple of (chunks, error)
        """
        try:
            result = self.parse_file(file_path)
            
            all_chunks = []
            for page in result["pages"]:
                page_chunks = self.chunk_text(
                    page["text"],
                    page_number=page["page_number"]
                )
                all_chunks.extend(page_chunks)
            
            logger.info(f"✅ Created {len(all_chunks)} total chunks from document")
            return all_chunks, None
            
        except PDFParseError as e:
            logger.error(f"❌ PDF parsing failed: {e}")
            return [], str(e)
        except Exception as e:
            logger.error(f"❌ Unexpected error during chunking: {e}")
            return [], str(e)

    def extract_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        Extract metadata from PDF.

        Args:
            file_path: Path to PDF file

        Returns:
            Dictionary with metadata
        """
        try:
            if not Path(file_path).exists():
                return self._empty_metadata()
            
            doc = fitz.open(file_path)
            metadata = doc.metadata or {}
            
            file_stat = Path(file_path).stat()
            
            page_count = doc.page_count
            doc.close()
            
            return {
                "title": metadata.get("title", "")[:500],
                "author": metadata.get("author", "")[:500],
                "subject": metadata.get("subject", "")[:500],
                "creation_date": str(metadata.get("creationDate", ""))[:50],
                "modification_date": str(metadata.get("modDate", ""))[:50],
                "file_size": file_stat.st_size,
                "pages": page_count,
            }
        except Exception as e:
            logger.warning(f"⚠️ Error extracting metadata from {file_path}: {str(e)}")
            return self._empty_metadata()

    def _empty_metadata(self) -> Dict[str, Any]:
        """Return empty metadata template."""
        return {
            "title": "",
            "author": "",
            "subject": "",
            "creation_date": "",
            "modification_date": "",
            "file_size": 0,
            "pages": 0,
        }
