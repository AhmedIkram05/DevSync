"""Add GitHub username to User model

Revision ID: a1b2c3d4e5f6
Revises: previous_migration_id
Create Date: 2023-12-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'previous_migration_id'  # replace with your actual previous migration ID
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('users', sa.Column('github_username', sa.String(100), nullable=True))

def downgrade():
    op.drop_column('users', 'github_username')
