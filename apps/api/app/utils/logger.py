import sys
from typing import Any

from loguru import logger

from app.core.config import get_settings


def configure_logging() -> None:
    """
    Configure loguru logging for the application

    Sets up console-only logging with different formats based on environment.
    No file logging is configured - all output goes to console/terminal.
    """
    settings = get_settings()

    # Remove default handler to avoid duplicate logs
    logger.remove()

    # Configure log format based on environment
    if settings.ENVIRONMENT == "development":
        # Development format - more detailed with colors
        log_format = (
            "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        )

        # Add console handler for development
        logger.add(
            sys.stderr,
            format=log_format,
            level=settings.LOG_LEVEL,
            colorize=True,
            backtrace=True,
            diagnose=True,
        )

    else:
        # Production format - structured and clean
        log_format = "{time:YYYY-MM-DD HH:mm:ss.SSS} | " "{level: <8} | " "{name}:{function}:{line} | " "{message}"

        # Console handler for production
        logger.add(
            sys.stdout,
            format=log_format,
            level=settings.LOG_LEVEL,
            colorize=False,
            backtrace=False,
            diagnose=False,
        )

    # Configure specific logger settings
    logger.configure(
        handlers=[
            {
                "sink": sys.stderr if settings.ENVIRONMENT == "development" else sys.stdout,
                "format": log_format,
                "level": settings.LOG_LEVEL,
                "colorize": settings.ENVIRONMENT == "development",
            }
        ]
    )

    # Log the initialization
    logger.info(
        "Logging configured",
        extra={
            "environment": settings.ENVIRONMENT,
            "log_level": settings.LOG_LEVEL,
            "debug_mode": settings.DEBUG,
        },
    )


def get_logger(name: str | None = None) -> Any:
    """
    Get a configured logger instance

    Args:
        name: Optional name for the logger. If None, uses the caller's module name

    Returns:
        Configured loguru logger instance
    """
    if name:
        return logger.bind(logger_name=name)
    return logger


def log_request_info(method: str, path: str, **kwargs: Any) -> None:
    """
    Log HTTP request information

    Args:
        method: HTTP method
        path: Request path
        **kwargs: Additional request details
    """
    logger.info(f"HTTP {method} {path}", extra={"http_method": method, "http_path": path, **kwargs})


def log_error(message: str, error: Exception | None = None, **kwargs: Any) -> None:
    """
    Log error information with optional exception details

    Args:
        message: Error message
        error: Optional exception object
        **kwargs: Additional error context
    """
    if error:
        logger.error(
            f"{message}: {error!s}", extra={"error_type": type(error).__name__, "error_message": str(error), **kwargs}
        )
    else:
        logger.error(message, extra=kwargs)
