"""Tests for project schemas."""

from datetime import datetime

import pytest
from pydantic import ValidationError

from app.schemas.project import ProjectListResponse, ProjectResponse


class TestProjectResponse:
    """Test ProjectResponse schema."""

    def test_project_response_valid_data(self):
        """Test ProjectResponse with valid data."""
        project_data = {
            "id": 1,
            "name": "Test Project",
            "is_active": True,
            "project_metadata": {"github": "https://github.com/test/repo", "jira": "TEST-PROJECT"},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "created_by": 1,
            "updated_by": 1,
        }

        response = ProjectResponse(**project_data)

        assert response.id == 1
        assert response.name == "Test Project"
        assert response.is_active is True
        assert response.project_metadata == {"github": "https://github.com/test/repo", "jira": "TEST-PROJECT"}
        assert response.created_by == 1
        assert response.updated_by == 1
        assert isinstance(response.created_at, datetime)
        assert isinstance(response.updated_at, datetime)

    def test_project_response_empty_metadata(self):
        """Test ProjectResponse with empty metadata."""
        project_data = {
            "id": 2,
            "name": "Empty Metadata Project",
            "is_active": False,
            "project_metadata": {},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "created_by": 2,
            "updated_by": 2,
        }

        response = ProjectResponse(**project_data)

        assert response.project_metadata == {}
        assert response.is_active is False

    def test_project_response_complex_metadata(self):
        """Test ProjectResponse with complex metadata structure."""
        complex_metadata = {
            "integrations": {
                "github": {
                    "url": "https://github.com/test/repo",
                    "branch": "main",
                    "private": False,
                    "collaborators": ["user1", "user2"],
                },
                "jira": {
                    "project_key": "TEST",
                    "url": "https://company.atlassian.net",
                    "issue_types": ["Story", "Bug", "Task"],
                    "custom_fields": {"sprint": "SPRINT-1", "priority": "High"},
                },
            },
            "settings": {
                "notifications": {
                    "enabled": True,
                    "channels": ["slack", "email"],
                    "events": ["deployment", "error", "completion"],
                },
                "deployment": {
                    "auto_deploy": True,
                    "environments": ["staging", "production"],
                    "rollback_enabled": True,
                },
            },
            "metrics": {
                "tracked_since": "2024-01-01",
                "kpis": ["uptime", "response_time", "error_rate"],
                "thresholds": {"response_time": 200, "error_rate": 0.01},
            },
        }

        project_data = {
            "id": 3,
            "name": "Complex Project",
            "is_active": True,
            "project_metadata": complex_metadata,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "created_by": 1,
            "updated_by": 1,
        }

        response = ProjectResponse(**project_data)

        assert response.project_metadata == complex_metadata
        assert response.project_metadata["integrations"]["github"]["url"] == "https://github.com/test/repo"
        assert response.project_metadata["settings"]["deployment"]["auto_deploy"] is True
        assert "uptime" in response.project_metadata["metrics"]["kpis"]

    def test_project_response_long_name(self):
        """Test ProjectResponse with maximum length name."""
        long_name = "A" * 50  # Maximum length as per model constraint

        project_data = {
            "id": 4,
            "name": long_name,
            "is_active": True,
            "project_metadata": {},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "created_by": 1,
            "updated_by": 1,
        }

        response = ProjectResponse(**project_data)
        assert response.name == long_name
        assert len(response.name) == 50

    def test_project_response_special_characters_in_metadata(self):
        """Test ProjectResponse with special characters in metadata."""
        special_metadata = {
            "unicode_text": "Hello 世界 🌍",
            "special_chars": "!@#$%^&*()_+-={}[]|\\:;\"'<>?,./",
            "json_escape": '{"nested": "value with \\"quotes\\""}',
            "urls": [
                "https://example.com/path?param=value&other=123",
                "ftp://files.example.com/folder/file.txt",
                "mailto:test@example.com",
            ],
            "regex_patterns": ["^[a-zA-Z0-9]+$", "\\d{3}-\\d{3}-\\d{4}", "(?i)\\b(test|staging|prod)\\b"],
        }

        project_data = {
            "id": 5,
            "name": "Special Chars Project",
            "is_active": True,
            "project_metadata": special_metadata,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "created_by": 1,
            "updated_by": 1,
        }

        response = ProjectResponse(**project_data)
        assert response.project_metadata == special_metadata
        assert response.project_metadata["unicode_text"] == "Hello 世界 🌍"
        assert len(response.project_metadata["urls"]) == 3

    def test_project_response_missing_required_fields(self):
        """Test ProjectResponse with missing required fields."""
        incomplete_data = {
            "id": 6,
            "name": "Incomplete Project"
            # Missing required fields: is_active, project_metadata, etc.
        }

        with pytest.raises(ValidationError) as exc_info:
            ProjectResponse(**incomplete_data)

        error_msg = str(exc_info.value)
        assert any(field in error_msg for field in ["is_active", "project_metadata", "created_at"])

    def test_project_response_invalid_types(self):
        """Test ProjectResponse with invalid field types."""
        invalid_data = {
            "id": "not_an_integer",  # Should be int
            "name": 123,  # Should be string
            "is_active": "not_boolean",  # Should be boolean
            "project_metadata": "not_a_dict",  # Should be dict
            "created_at": "not_a_datetime",  # Should be datetime
            "updated_at": "not_a_datetime",  # Should be datetime
            "created_by": "not_an_integer",  # Should be int
            "updated_by": "not_an_integer",  # Should be int
        }

        with pytest.raises(ValidationError):
            ProjectResponse(**invalid_data)

    def test_project_response_json_serialization(self):
        """Test ProjectResponse JSON serialization."""
        project_data = {
            "id": 7,
            "name": "JSON Test Project",
            "is_active": True,
            "project_metadata": {
                "github": "https://github.com/test/repo",
                "config": {"auto_deploy": True, "notifications": ["slack"]},
            },
            "created_at": datetime(2024, 1, 15, 10, 30, 0),
            "updated_at": datetime(2024, 1, 16, 14, 45, 0),
            "created_by": 1,
            "updated_by": 2,
        }

        response = ProjectResponse(**project_data)
        json_data = response.model_dump()

        assert json_data["id"] == 7
        assert json_data["name"] == "JSON Test Project"
        assert json_data["is_active"] is True
        assert json_data["project_metadata"]["github"] == "https://github.com/test/repo"
        assert json_data["created_by"] == 1
        assert json_data["updated_by"] == 2

        # Check datetime serialization
        assert isinstance(json_data["created_at"], datetime)
        assert isinstance(json_data["updated_at"], datetime)


class TestProjectListResponse:
    """Test ProjectListResponse schema."""

    def test_project_list_response_valid(self):
        """Test ProjectListResponse with valid data."""
        project_data = {
            "id": 1,
            "name": "List Test Project",
            "is_active": True,
            "project_metadata": {"github": "https://github.com/test/repo"},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "created_by": 1,
            "updated_by": 1,
        }

        project = ProjectResponse(**project_data)

        list_data = {"results": [project], "total": 1, "skip": 0, "limit": 10, "has_more": False}

        list_response = ProjectListResponse(**list_data)

        assert len(list_response.results) == 1
        assert list_response.total == 1
        assert list_response.skip == 0
        assert list_response.limit == 10
        assert list_response.has_more is False
        assert list_response.results[0].name == "List Test Project"

    def test_project_list_response_empty(self):
        """Test ProjectListResponse with empty project list."""
        list_data = {"results": [], "total": 0, "skip": 0, "limit": 10, "has_more": False}

        list_response = ProjectListResponse(**list_data)

        assert len(list_response.results) == 0
        assert list_response.total == 0
        assert list_response.has_more is False

    def test_project_list_response_multiple_projects(self):
        """Test ProjectListResponse with multiple projects."""
        projects = []
        for i in range(5):
            project_data = {
                "id": i + 1,
                "name": f"Project {i + 1}",
                "is_active": i % 2 == 0,  # Alternate active/inactive
                "project_metadata": {"type": "test", "order": i + 1, "tags": [f"tag{i + 1}", "testing"]},
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "created_by": (i % 3) + 1,  # Distribute among 3 users
                "updated_by": (i % 3) + 1,
            }
            projects.append(ProjectResponse(**project_data))

        list_data = {"results": projects, "total": 5, "skip": 0, "limit": 5, "has_more": False}

        list_response = ProjectListResponse(**list_data)

        assert len(list_response.results) == 5
        assert list_response.total == 5
        assert list_response.results[0].name == "Project 1"
        assert list_response.results[0].is_active is True
        assert list_response.results[1].is_active is False
        assert list_response.results[0].project_metadata["order"] == 1

    def test_project_list_response_with_pagination(self):
        """Test ProjectListResponse with pagination."""
        # Create 3 test projects for current page
        projects = []
        for i in range(3):
            project_data = {
                "id": i + 11,  # Starting from ID 11
                "name": f"Paginated Project {i + 11}",
                "is_active": True,
                "project_metadata": {"page": 2, "item": i + 1},
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "created_by": 1,
                "updated_by": 1,
            }
            projects.append(ProjectResponse(**project_data))

        list_data = {
            "results": projects,
            "total": 25,  # Total projects in database
            "skip": 10,  # Starting from 10th project (page 2)
            "limit": 3,  # Showing 3 projects per page
            "has_more": True,  # More projects available
        }

        list_response = ProjectListResponse(**list_data)

        assert len(list_response.results) == 3
        assert list_response.total == 25
        assert list_response.skip == 10
        assert list_response.limit == 3
        assert list_response.has_more is True
        assert list_response.results[0].name == "Paginated Project 11"

    def test_project_list_response_json_serialization(self):
        """Test ProjectListResponse JSON serialization."""
        project_data = {
            "id": 1,
            "name": "JSON List Project",
            "is_active": True,
            "project_metadata": {"serialization": "test"},
            "created_at": datetime(2024, 1, 1, 12, 0, 0),
            "updated_at": datetime(2024, 1, 2, 12, 0, 0),
            "created_by": 1,
            "updated_by": 1,
        }

        project = ProjectResponse(**project_data)

        list_data = {"results": [project], "total": 1, "skip": 0, "limit": 10, "has_more": False}

        list_response = ProjectListResponse(**list_data)
        json_data = list_response.model_dump()

        assert "results" in json_data
        assert len(json_data["results"]) == 1
        assert json_data["total"] == 1
        assert json_data["skip"] == 0
        assert json_data["limit"] == 10
        assert json_data["has_more"] is False
        assert json_data["results"][0]["name"] == "JSON List Project"
        assert json_data["results"][0]["project_metadata"]["serialization"] == "test"

    def test_project_list_response_invalid_data(self):
        """Test ProjectListResponse with invalid data."""
        invalid_data = {
            "results": "not_a_list",  # Should be list
            "total": "not_an_integer",  # Should be int
            "skip": -1,  # Might be invalid depending on validation
            "limit": "not_an_integer",  # Should be int
            "has_more": "not_boolean",  # Should be boolean
        }

        with pytest.raises(ValidationError):
            ProjectListResponse(**invalid_data)

    def test_project_list_response_boundary_values(self):
        """Test ProjectListResponse with boundary values."""
        # Test with zero values
        list_data = {"results": [], "total": 0, "skip": 0, "limit": 0, "has_more": False}

        list_response = ProjectListResponse(**list_data)
        assert list_response.total == 0
        assert list_response.skip == 0
        assert list_response.limit == 0

        # Test with large values
        large_list_data = {"results": [], "total": 999999, "skip": 999999, "limit": 999999, "has_more": True}

        large_list_response = ProjectListResponse(**large_list_data)
        assert large_list_response.total == 999999
        assert large_list_response.skip == 999999
        assert large_list_response.limit == 999999
