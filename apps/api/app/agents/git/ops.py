"""Thin wrappers for git clone, sparse checkout, etc."""

import asyncio
import os
import shutil
from pathlib import Path
from urllib.parse import urlparse

from loguru import logger


class GitOperationError(Exception):
    """Raised when git operations fail."""

    pass


class GitOps:
    """
    Minimal git operations for agent workflows.

    Provides thin wrappers around git CLI for:
    - Cloning repositories
    - Sparse checkout for performance
    - Basic validation
    """

    def _build_authenticated_url(self, *, url: str, access_token: str | None) -> str:
        """Return URL with embedded token for HTTPS hosts; fallback to original when not applicable.

        Uses the `x-access-token:TOKEN@host` form which is supported by GitHub and works for PATs.
        """
        if not access_token:
            return url
        try:
            parsed = urlparse(url)
            if parsed.scheme in {"http", "https"} and parsed.netloc:
                netloc_with_token = f"x-access-token:{access_token}@{parsed.netloc}"
                return parsed._replace(netloc=netloc_with_token).geturl()
        except Exception:
            return url
        return url

    async def clone_repository(
        self,
        *,
        url: str,
        destination_dir: Path,
        branch: str = "main",
        shallow: bool = True,
        access_token: str | None = None,
    ) -> Path:
        """
        Clone a repository to the specified destination.

        Args:
            url: Repository URL
            destination_dir: Directory to clone into
            branch: Git branch to checkout
            shallow: Whether to perform shallow clone
            access_token: Access token for HTTPS hosts (optional)

        Returns:
            str: Path to cloned repository

        Raises:
            GitOperationError: If clone operation fails
        """
        try:
            # Validate URL
            self._validate_repo_url(url)

            # Create destination directory
            destination_dir.mkdir(parents=True, exist_ok=True)

            # Generate repo directory name
            repo_name = self._extract_repo_name(url)
            repo_path = destination_dir / repo_name

            # Remove existing directory if it exists
            if repo_path.exists():
                shutil.rmtree(repo_path)

            # If an access token is provided for HTTPS hosts, inject it into the URL (avoid logging the token)
            tokenized_url = self._build_authenticated_url(url=url, access_token=access_token)

            # Build git clone command
            clone_cmd = ["git", "clone"]

            if shallow:
                clone_cmd.extend(["--depth", "1"])

            clone_cmd.extend(["--branch", branch, tokenized_url, repo_name])

            # Redact token in logs if present
            safe_url = url
            if access_token and isinstance(access_token, str) and access_token:
                safe_url = "<token_redacted>://" + urlparse(url).netloc + urlparse(url).path
            logger.info(f"Cloning repository: {safe_url} -> {repo_path}")

            env = os.environ.copy()
            env["GIT_TERMINAL_PROMPT"] = "0"

            # Execute clone command
            process = await asyncio.create_subprocess_exec(
                *clone_cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE, cwd=destination_dir, env=env
            )

            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                error_msg = f"Git clone failed: {stderr.decode()}"
                logger.error(error_msg)
                raise GitOperationError(error_msg)

            logger.info(f"Successfully cloned repository to: {repo_path}")
            return repo_path

        except Exception as e:
            logger.error(f"Failed to clone repository {url}: {e}")
            raise GitOperationError(f"Failed to clone repository {url}: {e}") from e

    def _validate_repo_url(self, url: str) -> None:
        """
        Validate repository URL.

        Args:
            url: Repository URL to validate

        Raises:
            GitOperationError: If URL is invalid
        """
        try:
            parsed = urlparse(url)

            # Basic validation
            if not parsed.scheme or not parsed.netloc:
                raise ValueError("Invalid URL format")

            # Allow common git hosting services
            allowed_hosts = ["github.com", "gitlab.com", "bitbucket.org"]

            if parsed.netloc not in allowed_hosts:
                logger.warning(f"Cloning from non-standard host: {parsed.netloc}")

        except Exception as e:
            raise GitOperationError(f"Invalid repository URL: {url}") from e

    def _extract_repo_name(self, url: str) -> str:
        """
        Extract repository name from URL.

        Args:
            url: Repository URL

        Returns:
            str: Repository name
        """
        try:
            # Handle both SSH and HTTPS URLs
            if url.endswith(".git"):
                url = url[:-4]

            parsed = urlparse(url)
            path_parts = parsed.path.strip("/").split("/")

            if len(path_parts) >= 2:
                return f"{path_parts[-2]}-{path_parts[-1]}"
            elif len(path_parts) == 1:
                return path_parts[0]
            else:
                return "repository"

        except Exception:
            return "repository"

    async def create_branch(
        self,
        *,
        repo_path: Path,
        branch_name: str,
        source_branch: str = "main",
    ) -> None:
        """
        Create and checkout a new branch in the repository.

        Args:
            repo_path: Path to the repository
            branch_name: Name of the new branch to create
            source_branch: Source branch to create from (default: main)

        Raises:
            GitOperationError: If branch creation fails
        """
        try:
            if not repo_path.exists():
                raise GitOperationError(f"Repository path does not exist: {repo_path}")

            # Check if branch already exists
            check_branch_cmd = ["git", "branch", "--list", branch_name]
            process = await asyncio.create_subprocess_exec(
                *check_branch_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=repo_path,
            )
            stdout, _ = await process.communicate()

            # If branch exists, just checkout
            if stdout.decode().strip():
                logger.info(f"Branch {branch_name} already exists, checking out")
                checkout_cmd = ["git", "checkout", branch_name]
            else:
                # Create and checkout new branch
                logger.info(f"Creating new branch {branch_name} from {source_branch}")
                checkout_cmd = ["git", "checkout", "-b", branch_name, source_branch]

            # Execute checkout command
            process = await asyncio.create_subprocess_exec(
                *checkout_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=repo_path,
            )

            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                error_msg = f"Git branch creation/checkout failed: {stderr.decode()}"
                logger.error(error_msg)
                raise GitOperationError(error_msg)

            logger.info(f"Successfully created/checked out branch: {branch_name}")

        except Exception as e:
            logger.error(f"Failed to create branch {branch_name}: {e}")
            raise GitOperationError(f"Failed to create branch {branch_name}: {e}") from e
