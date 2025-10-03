# Deployment Makefile for SDLC Agents API
# This Makefile orchestrates database migrations, seeding, and server startup
# All operations are delegated to manage.py for consistency

.PHONY: prestart run-server run-prod-server help



# Run prestart routine: wait for DB, acquire lock, migrate, seed
prestart:
	@echo "🚀 Starting prestart routine..."
	@python manage.py prestart

# Start the uvicorn server
run-server:
	@echo "🌐 Starting uvicorn server..."
	@python manage.py run

# Default target when used as container entrypoint
run-prod-server: prestart run-server


# Show available targets
help:
	@echo "Available targets:"
	@echo "  run-prod-server  - Run prestart then server (default)"
	@echo "  prestart         - Wait for DB, migrate, and seed"
	@echo "  run-server       - Start uvicorn server"
	@echo "  help             - Show this help message"
