"""Integration enums for providers, auth types, and capabilities."""

from enum import Enum


class IntegrationProvider(str, Enum):
    """Integration provider types."""

    GITHUB = "github"
    ATLASSIAN = "atlassian"
    NOTION = "notion"
    # Incident monitoring and observability providers
    SENTRY = "sentry"
    DATADOG = "datadog"
    PAGERDUTY = "pagerduty"
    CLOUDWATCH = "cloudwatch"
    GRAFANA = "grafana"
    NEW_RELIC = "new_relic"
    PLAYWRIGHT = "playwright"


class AuthType(str, Enum):
    """Authentication type enum for integrations."""

    OAUTH = "oauth"
    API_KEY = "api_key"
    PAT = "pat"


class IntegrationCapability(str, Enum):
    """Capabilities exposed by provider clients in utility APIs."""

    REPOSITORIES = "repositories"
    BRANCHES = "branches"
    PAGES = "pages"
    PROJECTS = "projects"
    ISSUES = "issues"
    SPACES = "spaces"
    PULL_REQUESTS = "pull_requests"
    # Incident monitoring and observability capabilities
    INCIDENTS = "incidents"
    ERRORS = "errors"
    METRICS = "metrics"
    LOGS = "logs"
    ALERTS = "alerts"
    SERVICES = "services"
    DATA_SOURCES = "data_sources"
