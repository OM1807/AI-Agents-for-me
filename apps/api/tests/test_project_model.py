"""Tests for Project model."""

from datetime import datetime

from app.models.project import Project


class TestProjectModel:
    """Test Project model."""

    def test_project_creation(self):
        """Test Project model creation."""
        project = Project(
            name="Test Project",
            is_active=True,
            project_metadata={"github": "https://github.com/test/repo"},
            created_by=1,
            updated_by=1,
        )

        assert project.name == "Test Project"
        assert project.is_active is True
        assert project.project_metadata == {"github": "https://github.com/test/repo"}
        assert project.created_by == 1
        assert project.updated_by == 1

    def test_project_defaults(self):
        """Test Project default values."""
        project = Project(name="Default Project", created_by=1, updated_by=1)

        assert project.is_active is True  # Default value
        assert project.project_metadata == {}  # Default empty dict

    def test_project_with_complex_metadata(self):
        """Test Project with complex metadata."""
        complex_metadata = {
            "github": {"url": "https://github.com/test/repo", "branch": "main", "private": False},
            "jira": {"project_key": "TEST", "url": "https://company.atlassian.net/browse/TEST"},
            "confluence": {"space": "DEV", "url": "https://company.atlassian.net/wiki/spaces/DEV"},
            "notion": {"workspace": "dev-team", "page_id": "abc123"},
            "figma": {"file_id": "fig123", "access_token": "secret"},
            "custom_fields": {"priority": "high", "category": "backend", "team_size": 5},
        }

        project = Project(name="Complex Project", project_metadata=complex_metadata, created_by=1, updated_by=1)

        assert project.project_metadata == complex_metadata
        assert project.project_metadata["github"]["url"] == "https://github.com/test/repo"
        assert project.project_metadata["jira"]["project_key"] == "TEST"
        assert project.project_metadata["custom_fields"]["team_size"] == 5

    def test_project_name_length_constraint(self):
        """Test Project name max length (50 characters)."""
        # Valid name (50 characters)
        valid_name = "A" * 50
        project = Project(name=valid_name, created_by=1, updated_by=1)
        assert project.name == valid_name
        assert len(project.name) == 50

    def test_project_active_inactive_states(self):
        """Test Project active and inactive states."""
        # Active project
        active_project = Project(name="Active Project", is_active=True, created_by=1, updated_by=1)
        assert active_project.is_active is True

        # Inactive project
        inactive_project = Project(name="Inactive Project", is_active=False, created_by=1, updated_by=1)
        assert inactive_project.is_active is False

    def test_project_repr(self):
        """Test Project string representation."""
        project = Project(name="Repr Project", created_by=5, updated_by=5)
        project.id = 10

        repr_str = repr(project)
        assert "Project" in repr_str
        assert "id=10" in repr_str
        assert "name='Repr Project'" in repr_str
        assert "created_by=5" in repr_str

    def test_project_metadata_operations(self):
        """Test Project metadata manipulation."""
        project = Project(name="Metadata Test Project", created_by=1, updated_by=1)

        # Initial empty metadata
        assert project.project_metadata == {}

        # Add metadata
        project.project_metadata["github"] = "https://github.com/test/repo"
        assert "github" in project.project_metadata
        assert project.project_metadata["github"] == "https://github.com/test/repo"

        # Update metadata
        project.project_metadata["github"] = "https://github.com/updated/repo"
        assert project.project_metadata["github"] == "https://github.com/updated/repo"

        # Add more fields
        project.project_metadata["jira"] = "TEST-PROJECT"
        project.project_metadata["team"] = "backend"

        assert len(project.project_metadata) == 3
        assert "jira" in project.project_metadata
        assert "team" in project.project_metadata

    def test_project_metadata_nested_structures(self):
        """Test Project metadata with nested structures."""
        project = Project(name="Nested Metadata Project", created_by=1, updated_by=1)

        # Set nested metadata
        project.project_metadata = {
            "integrations": {
                "source_control": {
                    "type": "github",
                    "config": {
                        "repository": "test/repo",
                        "default_branch": "main",
                        "webhooks": ["push", "pull_request"],
                    },
                },
                "project_management": {
                    "type": "jira",
                    "config": {
                        "project_key": "TEST",
                        "issue_types": ["Story", "Bug", "Task"],
                        "custom_fields": {"sprint": "SPRINT-1", "component": "backend"},
                    },
                },
            },
            "settings": {
                "auto_deploy": True,
                "code_review_required": True,
                "notification_channels": ["slack", "email"],
            },
        }

        # Verify nested access
        assert project.project_metadata["integrations"]["source_control"]["type"] == "github"
        assert project.project_metadata["integrations"]["project_management"]["config"]["project_key"] == "TEST"
        assert project.project_metadata["settings"]["auto_deploy"] is True
        assert "slack" in project.project_metadata["settings"]["notification_channels"]

    def test_project_metadata_with_different_types(self):
        """Test Project metadata with various data types."""
        project = Project(
            name="Mixed Types Project",
            project_metadata={
                "string_field": "test_value",
                "integer_field": 42,
                "float_field": 3.14,
                "boolean_field": True,
                "list_field": ["item1", "item2", "item3"],
                "dict_field": {"nested_key": "nested_value"},
                "null_field": None,
                "mixed_list": [1, "string", True, {"nested": "object"}],
            },
            created_by=1,
            updated_by=1,
        )

        assert project.project_metadata["string_field"] == "test_value"
        assert project.project_metadata["integer_field"] == 42
        assert project.project_metadata["float_field"] == 3.14
        assert project.project_metadata["boolean_field"] is True
        assert len(project.project_metadata["list_field"]) == 3
        assert project.project_metadata["dict_field"]["nested_key"] == "nested_value"
        assert project.project_metadata["null_field"] is None
        assert len(project.project_metadata["mixed_list"]) == 4

    def test_project_with_empty_name(self):
        """Test Project with empty name (should be valid but unusual)."""
        project = Project(name="", created_by=1, updated_by=1)
        assert project.name == ""

    def test_project_audit_fields(self):
        """Test Project audit fields from AuditedModel."""
        now = datetime.now()
        project = Project(name="Audit Test Project", created_by=1, updated_by=1)

        # Set audit fields manually for testing
        project.created_at = now
        project.updated_at = now

        assert project.created_by == 1
        assert project.updated_by == 1
        assert project.created_at == now
        assert project.updated_at == now

    def test_project_tablename_and_indexes(self):
        """Test Project table configuration."""
        # Test table name
        assert Project.__tablename__ == "projects"

        # Test that table args exist (indexes are defined)
        assert hasattr(Project, "__table_args__")
        assert Project.__table_args__ is not None

        # The indexes should be defined in __table_args__
        table_args = Project.__table_args__
        assert isinstance(table_args, tuple)
        assert len(table_args) > 0
