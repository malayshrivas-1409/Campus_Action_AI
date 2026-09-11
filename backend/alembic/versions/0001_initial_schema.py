"""Initial schema creation with all core tables.

Revision ID: 0001
Revises: 
Create Date: 2026-07-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='student'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('idx_users_email', 'users', ['email'], unique=True)

    # Create students table
    op.create_table(
        'students',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('roll_number', sa.String(50), nullable=False),
        sa.Column('department', sa.String(50), nullable=False),
        sa.Column('batch', sa.Integer(), nullable=False),
        sa.Column('cgpa', sa.Numeric(4, 2), nullable=True),
        sa.Column('backlogs', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('roll_number'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('idx_students_department', 'students', ['department'])
    op.create_index('idx_students_batch', 'students', ['batch'])
    op.create_index('idx_students_cgpa', 'students', ['cgpa'])

    # Create documents table
    op.create_table(
        'documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('document_type', sa.String(50), nullable=False),
        sa.Column('source_url', sa.String(1000), nullable=True),
        sa.Column('file_path', sa.String(1000), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=True),
        sa.Column('mime_type', sa.String(50), nullable=True),
        sa.Column('uploaded_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_documents_type', 'documents', ['document_type'])
    op.create_index('idx_documents_uploaded_at', 'documents', ['uploaded_at'], postgresql_desc=True)

    # Create document_versions table
    op.create_table(
        'document_versions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('effective_date', sa.DateTime(), nullable=False),
        sa.Column('superseded_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_latest', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['superseded_by'], ['document_versions.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('document_id', 'version_number')
    )
    op.create_index('idx_doc_versions_effective', 'document_versions', ['effective_date'], postgresql_desc=True)

    # Create document_chunks table
    op.create_table(
        'document_chunks',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_version_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('page_number', sa.Integer(), nullable=True),
        sa.Column('section', sa.String(255), nullable=True),
        sa.Column('embedding', sa.dialects.postgresql.ARRAY(sa.Float(), dimensions=1), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['document_version_id'], ['document_versions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_chunks_section', 'document_chunks', ['section'])
    op.create_index('idx_chunks_metadata', 'document_chunks', ['metadata'], postgresql_using='gin')

    # Create extraction_results table
    op.create_table(
        'extraction_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('extraction_type', sa.String(50), nullable=False),
        sa.Column('extracted_data', postgresql.JSONB(), nullable=False),
        sa.Column('source_chunks', postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column('confidence_score', sa.Numeric(3, 2), nullable=True),
        sa.Column('verified', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('verification_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_extraction_type', 'extraction_results', ['extraction_type'])

    # Create actions table
    op.create_table(
        'actions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action_title', sa.String(500), nullable=False),
        sa.Column('action_description', sa.Text(), nullable=True),
        sa.Column('action_type', sa.String(50), nullable=False),
        sa.Column('deadline', sa.DateTime(), nullable=True),
        sa.Column('is_mandatory', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('required_documents', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('dependencies', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('evidence_chunks', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('eligibility_requirements', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_actions_deadline', 'actions', ['deadline'])
    op.create_index('idx_actions_type', 'actions', ['action_type'])

    # Create student_actions table
    op.create_table(
        'student_actions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('student_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('eligibility_status', sa.String(50), nullable=False),
        sa.Column('eligibility_reason', sa.Text(), nullable=True),
        sa.Column('eligibility_confidence', sa.Numeric(3, 2), nullable=True),
        sa.Column('required_info', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('first_viewed_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('dismissed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['action_id'], ['actions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'action_id')
    )
    op.create_index('idx_student_actions_status', 'student_actions', ['status'])
    op.create_index('idx_student_actions_student', 'student_actions', ['student_id'])
    op.create_index('idx_student_actions_eligibility', 'student_actions', ['eligibility_status'])

    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('student_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('notification_type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['action_id'], ['actions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_notifications_unread', 'notifications', ['is_read', 'created_at'], postgresql_desc=True)
    op.create_index('idx_notifications_student', 'notifications', ['student_id'])

    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('action_type', sa.String(100), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=True),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('old_value', postgresql.JSONB(), nullable=True),
        sa.Column('new_value', postgresql.JSONB(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_audit_entity', 'audit_logs', ['entity_type', 'entity_id'])
    op.create_index('idx_audit_timestamp', 'audit_logs', ['created_at'], postgresql_desc=True)

    # Create conversations table
    op.create_table(
        'conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_conversations_user', 'conversations', ['user_id'])

    # Create conversation_messages table
    op.create_table(
        'conversation_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(50), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('sources', postgresql.JSON(), nullable=True),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_messages_conversation', 'conversation_messages', ['conversation_id'])


def downgrade() -> None:
    # Drop all tables in reverse order
    op.drop_index('idx_messages_conversation', table_name='conversation_messages')
    op.drop_table('conversation_messages')
    
    op.drop_index('idx_conversations_user', table_name='conversations')
    op.drop_table('conversations')
    
    op.drop_index('idx_audit_timestamp', table_name='audit_logs')
    op.drop_index('idx_audit_entity', table_name='audit_logs')
    op.drop_table('audit_logs')
    
    op.drop_index('idx_notifications_student', table_name='notifications')
    op.drop_index('idx_notifications_unread', table_name='notifications')
    op.drop_table('notifications')
    
    op.drop_index('idx_student_actions_eligibility', table_name='student_actions')
    op.drop_index('idx_student_actions_student', table_name='student_actions')
    op.drop_index('idx_student_actions_status', table_name='student_actions')
    op.drop_table('student_actions')
    
    op.drop_index('idx_actions_type', table_name='actions')
    op.drop_index('idx_actions_deadline', table_name='actions')
    op.drop_table('actions')
    
    op.drop_index('idx_extraction_type', table_name='extraction_results')
    op.drop_table('extraction_results')
    
    op.drop_index('idx_chunks_metadata', table_name='document_chunks')
    op.drop_index('idx_chunks_section', table_name='document_chunks')
    op.drop_table('document_chunks')
    
    op.drop_index('idx_doc_versions_effective', table_name='document_versions')
    op.drop_table('document_versions')
    
    op.drop_index('idx_documents_uploaded_at', table_name='documents')
    op.drop_index('idx_documents_type', table_name='documents')
    op.drop_table('documents')
    
    op.drop_index('idx_students_cgpa', table_name='students')
    op.drop_index('idx_students_batch', table_name='students')
    op.drop_index('idx_students_department', table_name='students')
    op.drop_table('students')
    
    op.drop_index('idx_users_email', table_name='users')
    op.drop_table('users')
    
    op.execute('DROP EXTENSION IF EXISTS vector')
