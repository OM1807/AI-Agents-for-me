"""add_requirements_to_code_agent

Revision ID: <new_revision_id>
Revises: 07f5dbabd4b1
Create Date: <new_creation_date>

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = '<new_revision_id>'
down_revision = '07f5dbabd4b1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add REQUIREMENTS_TO_CODE to enums and insert agent metadata."""

    # Add the new enum value to the agent identifier type
    op.execute("ALTER TYPE agentidentifier ADD VALUE IF NOT EXISTS 'REQUIREMENTS_TO_CODE'")

    # IMPORTANT: Commit the transaction so the new enum value is available.
    op.execute("COMMIT")

    # Insert the new agent's metadata with the corrected name and timestamps
    op.execute("""
        INSERT INTO ai_agents (
            name, description, identifier, module, tags, is_active,
            custom_properties_schema, created_at, updated_at
        )
        VALUES (
            'Requirements to Code',
            'Automatically generates production-ready code from Jira tickets, ClickUp tasks, or requirement documents. Creates new repositories or submits pull requests to existing ones.',
            'REQUIREMENTS_TO_CODE',
            'DEVELOPMENT',
            '["code-generation", "automation", "github", "jira", "clickup"]',
            true,
            '{"type": "object", "properties": {"inputs": {"type": "array", "description": "Source inputs for code generation", "items": {"type": "object", "properties": {"type": {"type": "string", "enum": ["issue", "task", "document"]}, "provider": {"type": "string", "enum": ["jira", "clickup", "file"]}, "key": {"type": "string"}, "url": {"type": "string"}, "file_name": {"type": "string"}}}}, "output_config": {"type": "object", "properties": {"type": {"type": "string", "enum": ["new_repo", "pull_request"]}, "repo_name": {"type": "string"}, "repo_url": {"type": "string"}, "base_branch": {"type": "string", "default": "main"}, "tech_stack": {"type": "object", "properties": {"language": {"type": "string"}, "framework": {"type": "string"}, "dependencies": {"type": "array"}}}}}, "options": {"type": "object", "properties": {"generate_tests": {"type": "boolean", "default": true}, "generate_docs": {"type": "boolean", "default": true}, "include_ci_cd": {"type": "boolean", "default": false}}}}, "required": ["inputs", "output_config"]}',
            NOW(),
            NOW()
        )
        ON CONFLICT (identifier) DO NOTHING;
    """)


def downgrade() -> None:
    """Remove the Requirements to Code agent."""
    # This is a safer downgrade. It removes the data but leaves the ENUM type.
    # Removing ENUM values is complex and often discouraged in migrations.
    op.execute("DELETE FROM ai_agents WHERE identifier = 'REQUIREMENTS_TO_CODE'")
