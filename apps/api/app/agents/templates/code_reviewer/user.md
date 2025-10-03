<task>
Review this pull request and generate structured feedback focusing on practical, actionable issues that impact code quality and system reliability.
</task>

<pr_information>
{% for input in inputs %}
<source>
<type>{{ input.type }}</type>
<provider>{{ input.provider }}</provider>
{% if input.type == "pr" %}
<url>{{ input.urls[0] }}</url>
{% endif %}
</source>
{% endfor %}
</pr_information>

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

<execution_requirements>
1. Retrieve PR content from GitHub
2. Analyze changes proportionally:
   - Simple changes (docs, config): Minimal review, focus on accuracy
   - Code changes: Check for bugs, security, performance issues
   - Complex changes: Deep analysis of architecture and risks
3. Generate comments only for genuine issues
4. Create properly structured artifacts following exact schemas
5. Focus on practical problems, not theoretical concerns
</execution_requirements>

<expected_output>
Provide a natural code review that:
- Identifies real problems worth fixing
- Explains impact and provides solutions
- Prioritizes by actual severity
- Maintains all required tracking data
- Communicates findings clearly without technical jargon
</expected_output>