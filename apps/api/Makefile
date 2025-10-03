# Makefile for API development
# Usage: make <target> [ARGS="..." / PYTEST_ARGS="..." / HOST=... / PORT=... / RELOAD=...]

PYTHON ?= python
SRC_PATHS := alembic app tests manage.py seeds
PYTEST_ARGS ?=
ARGS ?=
APP_SRC_PATHS := app

.PHONY: help format test run prestart manage link clean

help:
	@printf "Available targets:\n"
	@printf "  format    - run isort then black on source paths\n"
	@printf "  test      - run pytest (pass PYTEST_ARGS)\n"
	@printf "  link      - create a local ./manage wrapper that calls 'python3 manage.py'\n"
	@printf "  prestart  - run manage.py prestart (waits for DB, migrates, seeds)\n"
	@printf "  run       - run the app via manage.py run (pass ARGS or HOST/PORT/RELOAD)\n"
	@printf "  manage    - wrapper to invoke manage.py via python (pass ARGS)\n"

# Format: isort then black to keep consistent import ordering
format:
	@echo "🔧 Running isort on: $(SRC_PATHS)"
	@$(PYTHON) -m isort $(SRC_PATHS)
	@echo "🧹 Running black on: $(SRC_PATHS)"
	@$(PYTHON) -m black $(SRC_PATHS)

# Run tests with optional extra args
test:
	@echo "🧪 Running pytest"
	@$(PYTHON) -m pytest --cov=app --cov-report=term-missing $(PYTEST_ARGS)

# Linting: run ruff (auto-fix where possible) then mypy for type checks
lint:
	@echo "🔎 Running ruff (auto-fix) on: $(SRC_PATHS)"
	@$(PYTHON) -m ruff check $(SRC_PATHS) --fix || echo "⚠️  ruff reported issues"
	@echo "🔎 Running mypy on 'app'"
	@$(PYTHON) -m mypy app || echo "⚠️  mypy reported type issues"

# Run prestart (uses manage.py prestart)
prestart:
	@echo "⏳ Running prestart routine"
	@$(PYTHON) manage.py prestart


# Run the app via manage.py run. Accepts ARGS or HOST/PORT/RELOAD variables.
run:
	@echo "🚀 Starting app via manage.py run"
	@if [ -n "$(ARGS)" ]; then \
		$(PYTHON) manage.py run $(ARGS); \
	else \
		ARGS_BUILT=""; \
		if [ -n "$(HOST)" ]; then ARGS_BUILT="$$ARGS_BUILT --host $(HOST)"; fi; \
		if [ -n "$(PORT)" ]; then ARGS_BUILT="$$ARGS_BUILT --port $(PORT)"; fi; \
		if [ -n "$(RELOAD)" ]; then ARGS_BUILT="$$ARGS_BUILT --reload"; fi; \
		$(PYTHON) manage.py run $$ARGS_BUILT; \
	fi


clean:
	@echo "🧹 Cleaning __pycache__ and .pytest_cache"
	@find . -name "__pycache__" -type d -print0 | xargs -0 rm -rf || true
	@rm -rf .pytest_cache || true

precommit:
	@echo "🔎 Running precommit routine"
	@echo "🔎 Running ruff linting check on: $(APP_SRC_PATHS)"
	poetry run ruff check $(APP_SRC_PATHS)

	@echo "🔎 Running ruff formatting check on: $(APP_SRC_PATHS)"
	poetry run ruff format $(APP_SRC_PATHS) --check

	@echo "🔎 Running black formatting check on: $(APP_SRC_PATHS)"
	poetry run black $(APP_SRC_PATHS) --check --diff

	@echo "🔎 Running isort import sorting check on: $(APP_SRC_PATHS)"
	poetry run isort $(APP_SRC_PATHS) --check-only --diff

	@echo "🔎 Running MyPy type checking on: $(APP_SRC_PATHS)"
	poetry run mypy $(APP_SRC_PATHS)
