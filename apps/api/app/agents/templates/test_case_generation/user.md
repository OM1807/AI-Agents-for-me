Generate comprehensive test cases for the following inputs. Follow the JSON schemas defined in the system prompt exactly.

{% if inputs|length > 1 %}
## Parallel Processing Instructions:
You have {{ inputs|length }} input sources. Process them in parallel using sub-agents:
1. Spawn {{ inputs|length }} sub-agents simultaneously
2. Each sub-agent processes one source independently
3. Each sub-agent retrieves content via MCP and generates test cases
4. All sub-agents write to their respective folders in parallel
{% endif %}

## Input Sources to Process:
{% for input in inputs %}
### Source {{ loop.index }}: {{ input.type|upper }} from {{ input.provider|upper }}
{% if input.type == 'issue' %}
- **Jira Issue Key**: {{ input.key }}
{% elif input.type == 'document' %}
- **{{ input.provider|title }} Document**: {% if input.id %}ID: {{ input.id }}{% elif input.url %}{{ input.url }}{% endif %}
{% endif %}
{% endfor %}

{% if docs %}
## Supporting Documents:
{% for doc in docs %}
- {{ doc.provider }}: {% if doc.provider|lower == 'file' %}{{ doc.file_names|join(', ') }}{% elif doc.ids %}{{ doc.ids|join(', ') }}{% endif %}
{% endfor %}
{% endif %}

{% if mcps %}
## MCP Usage:
Available: {{ mcps|join(', ') }}
- Use Atlassian MCP for Jira issues and Confluence docs
- Use Notion MCP for Notion documents
- Retrieve full content before generating test cases
{% endif %}

## Test Generation Requirements:

### Test Types to Generate:
{% for test_type in output_config.type %}
- {{ test_type|capitalize }}
{% endfor %}

### Optional Fields to Include:
{% set sections = output_config.contents or output_config.fields or [] %}
{% if 'preconditions_setup' in sections %}✓ Include `preconditions` field
{% endif %}
{% if 'steps' in sections %}✓ Include `steps` field
{% endif %}
{% if 'expected_results' in sections %}✓ Include `expected_results` field
{% endif %}
{% if sections|length == 0 %}⚠️ No optional fields - use only 7 required fields
{% endif %}

{% if custom_instructions %}
## Special Instructions:
{{ custom_instructions }}
{% endif %}

## Generation Requirements:
Generate comprehensive test cases following internal structured format.

BEGIN GENERATION - Process all sources now.