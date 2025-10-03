"""Remove mcp_config from integrations table and system_prompt from ai_agents table

Revision ID: 7e1873cdacd9
Revises: 56cd3116b5a8
Create Date: 2025-08-26 13:24:11.153673

"""
import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "7e1873cdacd9"
down_revision = "56cd3116b5a8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Remove mcp_config column from integrations table and system_prompt from ai_agents table."""
    # Drop the mcp_config column from integrations table
    op.drop_column("integrations", "mcp_config")

    # Drop the system_prompt column from ai_agents table
    op.drop_column("ai_agents", "system_prompt")


def downgrade() -> None:
    """Add back mcp_config column to integrations table and system_prompt to ai_agents table."""
    # Add the mcp_config column back to integrations table
    op.add_column("integrations", sa.Column("mcp_config", sa.JSON(), nullable=False, server_default="{}"))

    # Add the system_prompt column back to ai_agents table
    op.add_column("ai_agents", sa.Column("system_prompt", sa.Text(), nullable=False, server_default=""))
