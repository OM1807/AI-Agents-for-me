"""add_integration_unique_constraints

Revision ID: a886752fd6b6
Revises: ed2aa9900293
Create Date: 2025-08-12 13:54:18.162902

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "a886752fd6b6"
down_revision = "ed2aa9900293"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add unique constraints to integrations table.

    Business Rules:
    - Each user can only have ONE integration per type (Atlassian, Notion, GitHub)
    - This is enforced by the unique constraint on (type, created_by)
    - Legacy constraint (type, is_active, created_by) already exists from initial migration
    """
    # Create unique constraint: one integration per type per user
    # This is the main business rule constraint
    op.create_unique_constraint("uq_integration_type_user", "integrations", ["type", "created_by"])


def downgrade() -> None:
    """Remove unique constraints from integrations table."""
    # Drop the main business rule constraint
    op.drop_constraint("uq_integration_type_user", "integrations", type_="unique")
