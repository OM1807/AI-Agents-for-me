# ruff: noqa
# mypy: ignore-errors
"""Mock agent workflow events.

These events emulate the backend SSE event objects that our adapter
transforms into AI SDK v4 data stream frames.

Intentionally simple and deterministic so they can be replaced later
by real workflow outputs.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from typing import Any


async def mock_agent_events() -> AsyncIterator[dict[str, Any]]:
    """Yield a realistic agent workflow sequence.

    Workflow follows a logical progression:
    1. Setup: Clone repositories
    2. Planning: Create TODO list
    3. Exploration: List directories and explore structure
    4. Reading: Read key files
    5. Analysis: Search for TODOs and patterns
    6. Creation: Create documentation files
    7. Completion: Mark all TODOs as done and summarize

    Event shapes follow our "source SSE dict" convention:
    - Text chunk:    {"type": "text", "data": {"text": "..."}}
    - Data part:     {"type": "data", "data": [ {..}, {..} ]}
    - Tool call:     {"type": "tool_call", "toolCallId": str, "toolName": str, "args": {...}}
    - Tool result:   {"type": "tool_result", "toolCallId": str, "result": {...} | str}
    - Error:         {"type": "error", "message": str}
    """

    # Tool name mapping reference (for documentation):
    # "TodoWrite": "todo", "Read": "read_file", "Write": "create_file", "Edit": "edit_file",
    # "MultiEdit": "edit_file", "LS": "list_directory", "Grep": "search_files", "Bash": "execute_command",
    # "WebSearch": "web_search", "WebFetch": "web_fetch", "NotebookRead": "read_notebook",
    # "NotebookEdit": "edit_notebook", "Task": "task_manager", "ExitPlanMode": "exit_plan_mode", "Glob": "glob_files"

    # 1. SETUP PHASE
    # Initial text chunks
    yield {"type": "text", "data": {"text": "Starting project analysis..."}}
    await asyncio.sleep(0.5)  # Brief pause after initialization
    yield {"type": "text", "data": {"text": "\nInitializing workspace and cloning repositories..."}}
    await asyncio.sleep(0.3)  # Short pause before first action

    # Git clone operations
    yield {
        "type": "tool_call",
        "toolCallId": "git_clone_12345_0",
        "toolName": "git_clone",
        "args": {
            "url": "https://github.com/tejas96/augmento-ai-intelligent-chat-bot",
            "prompt": "Cloning repository https://github.com/tejas96/augmento-ai-intelligent-chat-bot...",
        },
    }
    await asyncio.sleep(2.0)  # Simulate clone time
    yield {
        "type": "tool_result",
        "toolCallId": "git_clone_12345_0",
        "result": "Repository https://github.com/tejas96/augmento-ai-intelligent-chat-bot successfully cloned to: temp/12345/sdlc-agents-mvp",
    }

    yield {
        "type": "tool_call",
        "toolCallId": "git_clone_12345_1",
        "toolName": "git_clone",
        "args": {
            "url": "https://github.com/tejas96/sdlc-agentst",
            "prompt": "Cloning repository https://github.com/tejas96/sdlc-agents...",
        },
    }
    await asyncio.sleep(1.8)  # Simulate second clone time
    yield {
        "type": "tool_result",
        "toolCallId": "git_clone_12345_1",
        "result": "Repository https://github.com/tejas96/sdlc-agents successfully cloned to: temp/12345/sdlc-agents",
    }

    # 2. PLANNING PHASE
    await asyncio.sleep(0.8)  # Pause between phases
    yield {"type": "text", "data": {"text": "\nCreating task plan..."}}
    await asyncio.sleep(0.4)  # Think time before creating todos

    # Create initial todos for the work
    yield {
        "type": "tool_call",
        "toolCallId": "call_todo_001",
        "toolName": "todo",
        "args": {"file": "TODO.md", "item": "Explore repository structure"},
    }
    await asyncio.sleep(0.3)  # File creation time
    yield {
        "type": "tool_result",
        "toolCallId": "call_todo_001",
        "result": {"path": "TODO.md", "status": "created"},
    }

    yield {
        "type": "tool_call",
        "toolCallId": "call_todo_002",
        "toolName": "todo",
        "args": {"file": "TODO.md", "item": "Read key configuration files"},
    }
    await asyncio.sleep(0.2)  # Quick append
    yield {
        "type": "tool_result",
        "toolCallId": "call_todo_002",
        "result": {"path": "TODO.md", "status": "appended"},
    }

    yield {
        "type": "tool_call",
        "toolCallId": "call_todo_003",
        "toolName": "todo",
        "args": {"file": "TODO.md", "item": "Find and analyze existing TODOs"},
    }
    await asyncio.sleep(0.2)  # Quick append
    yield {
        "type": "tool_result",
        "toolCallId": "call_todo_003",
        "result": {"path": "TODO.md", "status": "appended"},
    }

    yield {
        "type": "tool_call",
        "toolCallId": "call_todo_004",
        "toolName": "todo",
        "args": {"file": "TODO.md", "item": "Create documentation files"},
    }
    await asyncio.sleep(0.2)  # Quick append
    yield {
        "type": "tool_result",
        "toolCallId": "call_todo_004",
        "result": {"path": "TODO.md", "status": "appended"},
    }

    # Planning data
    await asyncio.sleep(0.3)  # Brief pause before showing plan
    yield {"type": "data", "data": [{"plan": ["explore structure", "read files", "find todos", "create docs"]}]}

    # 3. EXPLORATION PHASE
    await asyncio.sleep(0.6)  # Phase transition
    yield {"type": "text", "data": {"text": "\nExploring repository structure..."}}
    await asyncio.sleep(0.3)  # Brief pause before exploration

    # List directory (LS)
    yield {
        "type": "tool_call",
        "toolCallId": "call_ls_001",
        "toolName": "list_directory",
        "args": {"path": ".", "long": True},
    }
    await asyncio.sleep(0.4)  # Directory listing time
    yield {
        "type": "tool_result",
        "toolCallId": "call_ls_001",
        "result": {
            "entries": [
                "README.md",
                "apps/",
                "packages/",
                "pnpm-workspace.yaml",
                "turbo.json",
                "docker-compose.yml",
                "TODO.md",
            ]
        },
    }

    # Mark first todo as done
    yield {
        "type": "tool_call",
        "toolCallId": "call_todo_done_001",
        "toolName": "todo",
        "args": {"file": "TODO.md", "item": "✅ Explore repository structure - COMPLETED"},
    }
    await asyncio.sleep(0.2)  # Quick todo update
    yield {
        "type": "tool_result",
        "toolCallId": "call_todo_done_001",
        "result": {"path": "TODO.md", "status": "updated"},
    }

    # 4. READING PHASE
    await asyncio.sleep(0.7)  # Phase transition
    yield {"type": "text", "data": {"text": "\nReading key files..."}}
    await asyncio.sleep(0.3)  # Brief pause before reading

    # Read README
    yield {
        "type": "tool_call",
        "toolCallId": "call_read_001",
        "toolName": "read_file",
        "args": {"path": "README.md"},
    }
    await asyncio.sleep(0.5)  # File read time
    yield {
        "type": "tool_result",
        "toolCallId": "call_read_001",
        "result": {"content": "# SDLC Agents\n\nProject documentation..."},
    }

    # Read package.json
    yield {
        "type": "tool_call",
        "toolCallId": "call_read_002",
        "toolName": "read_file",
        "args": {"path": "package.json"},
    }
    await asyncio.sleep(0.3)  # Small file read time
    yield {
        "type": "tool_result",
        "toolCallId": "call_read_002",
        "result": {"content": '{"name": "sdlc-agents", "version": "1.0.0"}'},
    }

    # Read main.py
    yield {
        "type": "tool_call",
        "toolCallId": "call_read_003",
        "toolName": "read_file",
        "args": {"path": "apps/api/app/main.py"},
    }
    await asyncio.sleep(0.4)  # Code file read time
    yield {
        "type": "tool_result",
        "toolCallId": "call_read_003",
        "result": {"content": "from fastapi import FastAPI\n\napp = FastAPI()\n# TODO: add error middleware"},
    }

    # Mark second todo as done
    yield {
        "type": "tool_call",
        "toolCallId": "call_todo_done_002",
        "toolName": "todo",
        "args": {"file": "TODO.md", "item": "✅ Read key configuration files - COMPLETED"},
    }
    await asyncio.sleep(0.2)  # Quick todo update
    yield {
        "type": "tool_result",
        "toolCallId": "call_todo_done_002",
        "result": {"path": "TODO.md", "status": "updated"},
    }

    # 5. ANALYSIS PHASE
    await asyncio.sleep(0.6)  # Phase transition
    yield {"type": "text", "data": {"text": "\nSearching for existing TODOs..."}}
    await asyncio.sleep(0.3)  # Brief pause before search

    # Search TODOs (Grep)
    yield {
        "type": "tool_call",
        "toolCallId": "call_grep_001",
        "toolName": "search_files",
        "args": {"query": "TODO|FIXME", "path": "."},
    }
    await asyncio.sleep(0.8)  # Search time across files
    yield {
        "type": "tool_result",
        "toolCallId": "call_grep_001",
        "result": {
            "matches": [
                {"file": "apps/api/app/main.py", "line": 12, "text": "# TODO: add error middleware"},
                {"file": "apps/web/src/app/page.tsx", "line": 8, "text": "// FIXME: update styles"},
            ]
        },
    }

    # Find Python files
    yield {
        "type": "tool_call",
        "toolCallId": "call_glob_001",
        "toolName": "glob_files",
        "args": {"pattern": "**/*.py"},
    }
    await asyncio.sleep(0.5)  # File pattern search time
    yield {
        "type": "tool_result",
        "toolCallId": "call_glob_001",
        "result": {"files": ["apps/api/app/main.py", "apps/api/app/utils/logger.py", "apps/api/tests/test_*.py"]},
    }

    # Mark third todo as done
    yield {
        "type": "tool_call",
        "toolCallId": "call_todo_done_003",
        "toolName": "todo",
        "args": {"file": "TODO.md", "item": "✅ Find and analyze existing TODOs - COMPLETED"},
    }
    await asyncio.sleep(0.2)  # Quick todo update
    yield {
        "type": "tool_result",
        "toolCallId": "call_todo_done_003",
        "result": {"path": "TODO.md", "status": "updated"},
    }

    # 6. CREATION PHASE
    await asyncio.sleep(0.7)  # Phase transition
    yield {"type": "text", "data": {"text": "\nCreating documentation files..."}}
    await asyncio.sleep(0.4)  # Think time before creating docs

    # Create CHANGELOG.md
    yield {
        "type": "tool_call",
        "toolCallId": "call_write_001",
        "toolName": "create_file",
        "args": {
            "path": "CHANGELOG.md",
            "content": "# Changelog\n\n## v1.0.0\n- Initial release\n- Basic project structure",
        },
    }
    await asyncio.sleep(0.6)  # File creation time
    yield {
        "type": "tool_result",
        "toolCallId": "call_write_001",
        "result": {"path": "CHANGELOG.md", "status": "created"},
    }

    # Create CONTRIBUTING.md
    yield {
        "type": "tool_call",
        "toolCallId": "call_write_002",
        "toolName": "create_file",
        "args": {
            "path": "CONTRIBUTING.md",
            "content": "# Contributing Guide\n\nWelcome to SDLC Agents!\n\n## Development Setup\n\n1. Clone the repository\n2. Install dependencies\n3. Start development",
        },
    }
    await asyncio.sleep(0.7)  # Larger file creation time
    yield {
        "type": "tool_result",
        "toolCallId": "call_write_002",
        "result": {"path": "CONTRIBUTING.md", "status": "created"},
    }

    # Update README with usage section
    yield {
        "type": "tool_call",
        "toolCallId": "call_edit_001",
        "toolName": "edit_file",
        "args": {"path": "README.md", "diff": "+ Added usage section\n+ Added installation instructions"},
    }
    await asyncio.sleep(0.4)  # File edit time
    yield {
        "type": "tool_result",
        "toolCallId": "call_edit_001",
        "result": {"path": "README.md", "status": "updated"},
    }

    # Mark final todo as done
    yield {
        "type": "tool_call",
        "toolCallId": "call_todo_done_004",
        "toolName": "todo",
        "args": {"file": "TODO.md", "item": "✅ Create documentation files - COMPLETED"},
    }
    await asyncio.sleep(0.2)  # Quick todo update
    yield {
        "type": "tool_result",
        "toolCallId": "call_todo_done_004",
        "result": {"path": "TODO.md", "status": "updated"},
    }

    # 7. COMPLETION PHASE
    await asyncio.sleep(0.8)  # Final phase transition
    yield {"type": "text", "data": {"text": "\nAll tasks completed successfully!"}}
    await asyncio.sleep(0.5)  # Pause before final summary

    # Final summary
    yield {
        "type": "tool_call",
        "toolCallId": "call_todo_summary",
        "toolName": "todo",
        "args": {
            "file": "TODO.md",
            "item": "\n## Summary\n✅ All planned tasks completed\n- Repository explored\n- Key files analyzed\n- Documentation created\n- Project ready for development",
        },
    }
    await asyncio.sleep(0.4)  # Summary creation time
    yield {
        "type": "tool_result",
        "toolCallId": "call_todo_summary",
        "result": {"path": "TODO.md", "status": "completed"},
    }

    # Final text chunks
    await asyncio.sleep(0.6)  # Pause before final messages
    yield {"type": "text", "data": {"text": "\nProject analysis and setup complete."}}
    await asyncio.sleep(0.4)  # Brief pause between final messages
    yield {
        "type": "text",
        "data": {"text": "\nAll documentation has been created and TODOs have been marked as done."},
    }
    await asyncio.sleep(0.3)  # Final pause before stream ends
