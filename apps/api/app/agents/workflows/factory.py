"""Workflow factory for agent workflow resolution."""

from collections.abc import Callable

from app.agents.enums import AgentIdentifier
from app.agents.workflows.base import AgentWorkflow


class WorkflowNotFoundError(Exception):
    """Raised when a requested workflow type is not found."""

    pass


class WorkflowFactory:
    """
    Factory for resolving and instantiating agent workflows.
    Workflows are registered using the `@register` decorator.

    Based on backend-technical-design.md section: Agent Workflows (Claude Code Wrapper)
    """

    def __init__(self) -> None:
        self._workflows: dict[AgentIdentifier, type[AgentWorkflow]] = {}

    def register(self, identifier: AgentIdentifier) -> Callable[[type[AgentWorkflow]], type[AgentWorkflow]]:
        """
        Decorator to register an AgentWorkflow class with a specific identifier.

        Args:
            identifier: The unique identifier for the workflow (e.g., AgentIdentifier.CODE_ANALYSIS).

        Usage:
            @register(AgentIdentifier.CODE_ANALYSIS)
            class CodeDocsWorkflow(AgentWorkflow):
                ...
        """

        def _wrap(cls: type[AgentWorkflow]) -> type[AgentWorkflow]:
            if not hasattr(cls, "run"):
                raise TypeError(f"Class {cls.__name__} must implement AgentWorkflow protocol.")
            if identifier in self._workflows:
                raise ValueError(f"Workflow with identifier '{identifier}' already registered.")
            self._workflows[identifier] = cls
            return cls

        return _wrap

    def resolve(self, identifier: AgentIdentifier) -> type[AgentWorkflow]:
        """
        Resolve and return the AgentWorkflow class for a given identifier.

        Args:
            identifier: The unique identifier for the workflow.

        Returns:
            type[AgentWorkflow]: The registered workflow class.

        Raises:
            WorkflowNotFoundError: If no workflow is registered for the given identifier.
        """
        workflow_cls = self._workflows.get(identifier)
        if not workflow_cls:
            raise WorkflowNotFoundError(f"No workflow registered for identifier: {identifier}")
        return workflow_cls


# Global factory instance
workflow_factory = WorkflowFactory()

# Convenience function for registration
register = workflow_factory.register
