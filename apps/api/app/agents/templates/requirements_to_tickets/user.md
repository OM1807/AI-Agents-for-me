<task>
Generate JIRA tickets from the provided inputs according to the schemas and rules defined in your system instructions.
</task>

<inputs_to_process>
{% for input in inputs %}
<input_source index="{{ loop.index }}">
<type>{{ input.type }}</type>
<provider>{{ input.provider }}</provider>
{% if input.type == "epic" %}
<jira_keys>{{ input['keys'] | join(', ') }}</jira_keys>
<action>Generate stories and tasks for these existing epics while preserving their JIRA keys and IDs</action>
{% elif input.type == "document" %}
{% if input.urls and input.urls|length > 0 %}
<urls>{{ input.urls |  join(', ') }}</urls>
{% endif %}
{% if input.ids and input.ids|length > 0 %}
<ids>{{ input.ids |  join(', ') }}</ids>
{% endif %}
{% if input.names and input.names|length > 0 %}
<filenames>{{ input.names |  join(', ') }}</filenames>
{% endif %}
<action>Extract requirements and create complete epic→(tasks & stories) hierarchy</action>
{% endif %}
</input_source>
{% endfor %}
</inputs_to_process>

{% if docs and docs|length > 0 %}
<supporting_documents>
{% for doc in docs %}
<document>
<provider>{{ doc.provider }}</provider>
{% if doc.urls and doc.urls|length > 0 %}
<urls>{{ doc.urls | join(', ')  }}</urls>
{% endif %}
{% if doc.ids and doc.ids|length > 0 %}
<ids>{{ doc.ids | join(', ') }}</ids>
{% endif %}
{% if doc.names and doc.names|length > 0 %}
<filenames>{{ doc.names | join(', ') }}</filenames>
{% endif %}
</document>
{% endfor %}
</supporting_documents>
{% endif %}

<output_configuration>
<ticket_types>
{% for output in outputs %}
<{{ output.type }}>
<generate>true</generate>
<include_fields>
{# Map content elements to actual JSON fields #}
{% for content in output.contents %}
{% if content == "general_info" %}
{# general_info always includes these core fields #}
- id (required)
- type (required)
- title (required)
- description (required)
- state (required)
- jira_key (required)
- jira_id (required)
{% if output.type in ["story", "task"] %}
- parent_id (required)
- parent_type (required)
{% endif %}
{% elif content == "tags" or content == "labels" %}
- labels (optional)
{% elif content == "references" %}
- references (optional)
{% elif content == "priority" %}
- priority (optional)
{% elif content == "estimation" %}
- estimation (optional)
{% else %}
- {{ content }} (optional)
{% endif %}
{% endfor %}
</include_fields>
</{{ output.type }}>
{% endfor %}
</ticket_types>
<descriptive_level>{{ descriptive_level }}</descriptive_level>
</output_configuration>

<execution_instructions>
1. Retrieve full content from all input sources using appropriate MCPs
2. Analyze requirements to identify business capabilities
3. Generate requested ticket types ({{ outputs|map(attribute='type')|join(', ') }})
4. Include ONLY the JSON fields mapped from specified content elements (see system instructions for mapping)
5. Apply {{ descriptive_level }} descriptive level as defined in system instructions
6. Validate all tickets against schemas before presenting
7. Use business language only - never mention technical implementation
</execution_instructions>

<response_requirements>
Present the results as a business-focused ticket hierarchy report showing:
- Processing summary
- Generated ticket hierarchy organized by epics
- Coverage analysis of requirements addressed
- Statistics and distribution
- Recommendations for next steps

Remember: Follow all schema definitions, validation rules, and output communication guidelines from your system instructions.
</response_requirements>