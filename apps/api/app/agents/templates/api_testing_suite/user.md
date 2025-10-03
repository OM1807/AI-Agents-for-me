<task>
{{ project }}. Create {{ framework }} API test automation suite with executable test files that validate API endpoints and integrate with existing projects or provide standalone test organization.
</task>

<api_specifications>
{% for spec in api_specs %}
<source>
<provider>{{ spec.provider }}</provider>
{% if spec.provider == "openapi" or spec.provider == "swagger" or spec.provider == "postman" %}
<url>{{ spec.urls[0] }}</url>
{% elif spec.provider == "file" %}
<files>{{ spec.names | join(', ') }}</files>
{% endif %}
</source>
{% endfor %}
</api_specifications>

<test_requirements>
{% for source in testcase_sources %}
<source>
<provider>{{ source.provider }}</provider>
{% if source.provider == "jira" %}
<keys>{{ source['keys'] | join(', ') }}</keys>
<urls>{{ source.urls | join(', ') }}</urls>
{% elif source.provider == "file" %}
<files>{{ source.names | join(', ') }}</files>
{% endif %}
</source>
{% endfor %}
</test_requirements>

{% if docs and docs|length > 0 %}
<supporting_documents>
{% for doc in docs %}
<document>
<provider>{{ doc.provider }}</provider>
{% if doc.urls and doc.urls|length > 0 %}
<urls>{{ doc.urls | join(', ') }}</urls>
{% endif %}
{% if doc.ids and doc.ids|length > 0 %}
<ids>{{ doc.ids | join(', ') }}</ids>
{% endif %}
{% if doc.names and doc.names|length > 0 %}
<files>{{ doc.names | join(', ') }}</files>
{% endif %}
</document>
{% endfor %}
</supporting_documents>
{% endif %}

{% if repo and repo.url %}
<repository>
<url>{{ repo.url }}</url>
<branch>{{ repo.branch | default('main') }}</branch>
</repository>
{% endif %}

<execution_requirements>
1. Analyze API specifications to extract endpoints and authentication methods
2. Process test requirements from JIRA tickets and documentation sources
3. Generate {{ framework }} test files with comprehensive coverage:
   - Essential CRUD operations and core functionality
   - Full HTTP methods with authentication and authorization
   - End-to-end workflows with security and edge case testing
4. Follow existing repository patterns if GitHub repo provided
5. Create organized standalone structure if no repository provided
6. Validate generated tests using Playwright MCP integration
</execution_requirements>

<expected_output>
Provide executable API test automation that:
- Covers all specified endpoints with appropriate test scenarios
- Includes positive, negative, and edge case validation
- Follows {{ framework }} framework conventions and best practices
- Integrates seamlessly with existing project structure (if repository provided)
- Provides immediate test execution capability for CI/CD workflows
</expected_output>