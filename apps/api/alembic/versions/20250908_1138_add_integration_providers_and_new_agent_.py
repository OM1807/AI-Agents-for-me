"""add integration providers and new agent enum

Revision ID: c9cb1d6ccc89
Revises: 9dbe7c4d62da
Create Date: 2025-09-08 11:38:07.636821

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "c9cb1d6ccc89"
down_revision = "9dbe7c4d62da"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add monitoring providers to the integrationprovider enum
    op.execute("ALTER TYPE integrationprovider ADD VALUE 'SENTRY'")
    op.execute("ALTER TYPE integrationprovider ADD VALUE 'DATADOG'")
    op.execute("ALTER TYPE integrationprovider ADD VALUE 'PAGERDUTY'")
    op.execute("ALTER TYPE integrationprovider ADD VALUE 'CLOUDWATCH'")
    op.execute("ALTER TYPE integrationprovider ADD VALUE 'GRAFANA'")
    op.execute("ALTER TYPE integrationprovider ADD VALUE 'NEW_RELIC'")

    # Add agent identifier to the agentidentifier enum
    op.execute("ALTER TYPE agentidentifier ADD VALUE 'ROOT_CAUSE_ANALYSIS'")


def downgrade() -> None:
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type, which is complex
    # For simplicity, we'll leave this as a no-op
    # In production, consider using a more sophisticated enum migration strategy
    pass
