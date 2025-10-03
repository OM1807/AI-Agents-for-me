"""Minimal CLI to run Claude Orchestrator directly for testing.

Usage examples:

  - Run with a one-line prompt:
      python apps/api/app/run_orchestrator.py run -m "List files in this repo and suggest refactors"

  - Read prompt from stdin (end with Ctrl-D):
      python apps/api/app/run_orchestrator.py run --stdin

  - Read prompt from a file:
      python apps/api/app/run_orchestrator.py run --message-file prompt.txt

  - Use a custom system prompt file and workspace:
      python apps/api/app/run_orchestrator.py run -m "Analyze" \
        --system-prompt-file apps/api/sample_rendered_system_prompt.md \
        --workspace-dir /tmp/sdlc-agents-workspace

  - Provide MCP servers config via JSON file:
      python apps/api/app/run_orchestrator.py run -m "Analyze" --mcp-config mcp.json

Notes:
  - Requires CLAUDE_CODE_OAUTH_TOKEN in environment for Claude Code SDK.
  - By default, uses apps/api/sample_rendered_system_prompt.md if present.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Any, Optional

import typer

from app.agents.claude.orchestrator import ClaudeOrchestrator
from app.core.config import get_settings

# Ensure absolute imports like `app.*` work when running this file directly
_HERE = Path(__file__).resolve()
_APPS_API_DIR = _HERE.parents[1]  # apps/api
if str(_APPS_API_DIR) not in sys.path:
    sys.path.insert(0, str(_APPS_API_DIR))


def _read_text_file(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return ""


def _default_system_prompt() -> str:
    """Return a reasonable default system prompt.

    Prefers the repository's sample system prompt if available.
    """
    candidate = Path(__file__).resolve().parents[1] / "sample_rendered_system_prompt.md"
    text = _read_text_file(candidate)
    if text.strip():
        return text
    return (
        "You are a senior software engineer assisting with code understanding, refactoring, and testing. "
        "Be precise, concise, and show step-by-step reasoning only when necessary."
    )


def _resolve_system_prompt(*, system_prompt_file: str | None) -> str:
    if isinstance(system_prompt_file, str):
        p = Path(system_prompt_file)
        if p.is_file():
            content = _read_text_file(p)
            if content.strip():
                return content
    return _default_system_prompt()


def _resolve_workspace_dir(*, workspace_dir: str | None) -> Path:
    settings = get_settings()
    if isinstance(workspace_dir, str) and workspace_dir:
        return Path(workspace_dir).expanduser().resolve()
    if isinstance(settings.AGENTS_DIR, str) and settings.AGENTS_DIR:
        return Path(settings.AGENTS_DIR).expanduser().resolve()
    return Path.cwd()


def _resolve_mcp_configs(*, mcp_config: str | None) -> dict[str, dict[str, Any]]:
    if not isinstance(mcp_config, str) or not mcp_config:
        return {}
    try:
        path = Path(mcp_config).expanduser().resolve()
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            # Expect mapping of serverName -> config dict
            return {k: v for k, v in data.items() if isinstance(k, str) and isinstance(v, dict)}
    except Exception:
        pass
    return {}


def _read_message(*, message: str | None, message_file: str | None, read_stdin: bool) -> str:
    if isinstance(message, str) and message.strip():
        return message
    if isinstance(message_file, str) and message_file:
        p = Path(message_file).expanduser().resolve()
        if p.is_file():
            content = _read_text_file(p)
            if content.strip():
                return content
    if read_stdin:
        return sys.stdin.read()
    # Fallback prompt
    return "Summarize the repository structure and suggest areas for test coverage improvements."


def _warn_missing_api_key() -> None:
    if not os.getenv("CLAUDE_CODE_OAUTH_TOKEN"):
        typer.echo(
            "[warn] CLAUDE_CODE_OAUTH_TOKEN not set. The run will fail unless the SDK has other auth configured."
        )


async def _stream(
    orchestrator: ClaudeOrchestrator, messages: list[dict[str, Any]], system_prompt: str, as_json: bool
) -> None:
    async for event in orchestrator.run(messages, system_prompt=system_prompt):
        if as_json:
            typer.echo(json.dumps(event, ensure_ascii=False))
            continue

        etype = event.get("type")
        if etype == "text":
            data = event.get("data", {})
            text = data.get("text", "")
            typer.echo(text, nl=False)
        elif etype == "tool_call":
            name = event.get("toolName")
            args = event.get("args")
            typer.echo(f"\n[tool_call] {name} {args}")
        elif etype == "tool_result":
            result = event.get("result")
            typer.echo(f"\n[tool_result] {result}")
        elif etype == "system":
            data = event.get("data")
            typer.echo(f"\n[system] {data}")
        elif etype == "finish":
            data = event.get("data", {})
            reason = data.get("finishReason")
            typer.echo(f"\n\n[finish] reason={reason} details={data}")


async def _amain(
    *,
    message: str | None,
    message_file: str | None,
    stdin: bool,
    system_prompt_file: str | None,
    workspace_dir: str | None,
    mcp_config: str | None,
    resume_session_id: str | None,
    json_output: bool,
) -> int:
    _warn_missing_api_key()

    system_prompt = _resolve_system_prompt(system_prompt_file=system_prompt_file)
    resolved_workspace = _resolve_workspace_dir(workspace_dir=workspace_dir)
    mcp_configs = _resolve_mcp_configs(mcp_config=mcp_config)
    user_message = _read_message(message=message, message_file=message_file, read_stdin=stdin)

    messages: list[dict[str, Any]] = [
        {"role": "user", "content": user_message},
    ]

    orchestrator = ClaudeOrchestrator(
        system_prompt=system_prompt,
        base_dir=resolved_workspace,
        mcp_configs=mcp_configs,
        resume_session_id=resume_session_id,
    )

    typer.echo(f"[info] workspace_dir={resolved_workspace}")
    typer.echo(f"[info] mcp_servers={list(mcp_configs.keys()) if mcp_configs else 'none'}")

    await _stream(orchestrator, messages, system_prompt, as_json=json_output)
    return 0


app = typer.Typer(help="Run Claude Orchestrator directly for testing")


@app.command(name="run")
def cli_run(
    message: Optional[str] = typer.Option(None, "-m", "--message", help="User message to send to orchestrator"),
    stdin: bool = typer.Option(False, "--stdin", help="Read the user message from stdin"),
    message_file: Optional[str] = typer.Option(
        None, "--message-file", help="Path to a file containing the user message"
    ),
    system_prompt_file: Optional[str] = typer.Option(
        None,
        "--system-prompt-file",
        help="Path to a system prompt file (default: sample_rendered_system_prompt.md if present)",
    ),
    workspace_dir: Optional[str] = typer.Option(
        None,
        "--workspace-dir",
        help="Directory to use as workspace/cwd during run (default: settings.AGENTS_DIR or CWD)",
    ),
    mcp_config: Optional[str] = typer.Option(
        None, "--mcp-config", help="Path to JSON file mapping MCP server names to configs (optional)"
    ),
    resume_session_id: Optional[str] = typer.Option(None, "--resume-session-id", help="Resume session id (optional)"),
    json_output: bool = typer.Option(False, "--json", help="Print raw JSON events instead of pretty text"),
) -> None:
    """Run the orchestrator and stream responses."""
    exit_code = asyncio.run(
        _amain(
            message=message,
            message_file=message_file,
            stdin=stdin,
            system_prompt_file=system_prompt_file,
            workspace_dir=workspace_dir,
            mcp_config=mcp_config,
            resume_session_id=resume_session_id,
            json_output=json_output,
        )
    )
    raise SystemExit(exit_code)


def main() -> None:
    app()


if __name__ == "__main__":
    main()
