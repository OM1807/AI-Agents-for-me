"""add api test suite agent and playwright integration provider

Revision ID: 07f5dbabd4b1
Revises: c9cb1d6ccc89
Create Date: 2025-09-26 18:15:48.792127

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "07f5dbabd4b1"
down_revision = "c9cb1d6ccc89"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add API Testing Suite agent identifier and Playwright integration provider
    op.execute("ALTER TYPE agentidentifier ADD VALUE 'API_TESTING_SUITE'")
    op.execute("ALTER TYPE integrationprovider ADD VALUE 'PLAYWRIGHT'")


def downgrade() -> None:
    # Remove API Testing Suite agent identifier and Playwright integration provider
    op.execute("ALTER TYPE agentidentifier DROP VALUE 'API_TESTING_SUITE'")
    op.execute("ALTER TYPE integrationprovider DROP VALUE 'PLAYWRIGHT'")
