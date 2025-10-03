"""Agent enums for workflow types, modules, and statuses."""

from enum import Enum


class AgentIdentifier(str, Enum):
    """Supported agent identifiers."""

    CODE_ANALYSIS = "code_analysis"
    TEST_CASE_GENERATION = "test_case_generation"
    REQUIREMENTS_TO_TICKETS = "requirements_to_tickets"
    ROOT_CAUSE_ANALYSIS = "root_cause_analysis"
    CODE_REVIEWER = "code_reviewer"
    API_TESTING_SUITE = "api_testing_suite"


class AgentModule(str, Enum):
    """Agent capability modules."""

    DEVELOPMENT = "development"
    PROJECT_MANAGEMENT = "project_management"
    QUALITY_ASSURANCE = "quality_assurance"
