Generate documentation for the provided codebase, documents. 
{% if docs %}
## Supporting Documents:
{% for doc in docs %}
- {{ doc.provider }}: {% if doc.urls %}{{ doc.urls|join(', ') }}{% elif doc.ids %}{{ doc.ids|join(', ') }}{% endif %}
{% endfor %}
{% endif %}

{% if mcps %}
## MCP Usage:
Available: {{ mcps|join(', ') }}
- Use Atlassian MCP for Jira issues and Confluence docs
- Use Notion MCP for Notion documents
- Retrieve full content before generating test cases
{% endif %}