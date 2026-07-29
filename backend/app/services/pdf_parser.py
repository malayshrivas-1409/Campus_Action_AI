"""PDF parsing and text extraction service."""

import io
import logging
from typing import List, Tuple, Optional
from pathlib import Path

import fitz  # PyMuPDF
from app.logger import logger


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

    def parse_file(self, file_path: str) -> dict:
        """
        Parse a PDF file and extract content.

        Args:
            file_path: Path to PDF file

        Returns:
            Dictionary with parsed content and metadata
        """
        try:
            doc = fitz.open(file_path)
            
            pages = []
            for page_num, page in enumerate(doc, 1):
                text = page.get_text()
                pages.append({
                    "page_number": page_num,
                    "text": text.strip(),
                    "width": page.rect.width,
                    "height": page.rect.height,
                })
            
            doc.close()
            
            return {
                "success": True,
                "total_pages": len(pages),
                "pages": pages,
                "error": None,
            }
        except Exception as e:
            logger.error(f"Error parsing PDF {file_path}: {str(e)}")
            return {
                "success": False,
                "total_pages": 0,
                "pages": [],
                "error": str(e),
            }

    def chunk_text(self, text: str, page_number: int = 1) -> List[dict]:
        """
        Split text into overlapping chunks.

        Args:
            text: Text to chunk
            page_number: Page number for metadata

        Returns:
            List of chunk dictionaries
        """
        chunks = []
        start = 0
        chunk_index = 0

        while start < len(text):
            # Get chunk
            end = min(start + self.max_chunk_size, len(text))
            chunk_text = text[start:end].strip()

            if chunk_text:  # Skip empty chunks
                chunks.append({
                    "chunk_index": chunk_index,
                    "content": chunk_text,
                    "page_number": page_number,
                    "start_char": start,
                    "end_char": end,
                })
                chunk_index += 1

            # Move to next chunk with overlap
            start = end - self.overlap if end < len(text) else end

        return chunks

    def extract_and_chunk(self, file_path: str) -> Tuple[List[dict], Optional[str]]:
        """
        Parse PDF and split into chunks.

        Args:
            file_path: Path to PDF file

        Returns:
            Tuple of (chunks, error)
        """
        result = self.parse_file(file_path)
        
        if not result["success"]:
            return [], result["error"]

        all_chunks = []
        for page in result["pages"]:
            page_chunks = self.chunk_text(
                page["text"],
                page_number=page["page_number"]
            )
            all_chunks.extend(page_chunks)

        return all_chunks, None

    def extract_metadata(self, file_path: str) -> dict:
        """
        Extract metadata from PDF.

        Args:
            file_path: Path to PDF file

        Returns:
            Dictionary with metadata
        """
        try:
            doc = fitz.open(file_path)
            metadata = doc.metadata or {}
            
            file_stat = Path(file_path).stat()
            
            doc.close()
            
            return {
                "title": metadata.get("title", ""),
                "author": metadata.get("author", ""),
                "subject": metadata.get("subject", ""),
                "creation_date": metadata.get("creationDate"),
                "modification_date": metadata.get("modDate"),
                "file_size": file_stat.st_size,
                "pages": len(doc) if doc else 0,
            }
        except Exception as e:
            logger.error(f"Error extracting metadata from {file_path}: {str(e)}")
            return {
                "title": "",
                "author": "",
                "subject": "",
                "creation_date": None,
                "modification_date": None,
                "file_size": 0,
                "pages": 0,
            }
