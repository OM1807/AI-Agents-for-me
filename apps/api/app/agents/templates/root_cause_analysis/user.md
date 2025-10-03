<task>
Conduct comprehensive root cause analysis for the provided incident. Generate artifacts/index.json and artifacts/rca.json artifacts following exact schemas. Apply contextual CTA logic based on actual input availability.
</task>

<incident_data>
<incident>
<provider>{{ incident.provider }}</provider>
</incident>
<full_incident_object>
```json
{{ incident.agent_payload }}
</full_incident_object>
</incident_data>

{% if logs and logs|length > 0 %}
<log_sources>
{% for log in logs %}
<log_source>
<provider>{{ log.provider }}</provider>
{% if log.service_id %}
<service_id>{{ log.service_id }}</service_id>
{% endif %}
{% if log.project_id %}
<project_id>{{ log.project_id }}</project_id>
{% endif %}
{% if log.url %}
<url>{{ log.url }}</url>
{% endif %}
{% if log.file %}
<file>{{ log.file }}</file>
{% endif %}
<time_range>{{ log.dateRange | default('2h') }}</time_range>
</log_source>
{% endfor %}
</log_sources>
{% endif %}

{% if github_repos and github_repos|length > 0 %}
<source_code_repositories>
{% for repo in github_repos %}
<repository>
<provider>{{ repo.provider }}</provider>
<url>{{ repo.url }}</url>
</repository>
{% endfor %}
</source_code_repositories>
{% endif %}

{% if docs and docs|length > 0 %}
<supporting_documents>
{% for doc in docs %}
<document>
<provider>{{ doc.provider }}</provider>
{% if doc.ids and doc.ids|length > 0 %}
<ids>{{ doc.ids | join(', ') }}</ids>
{% endif %}
{% if doc.urls and doc.urls|length > 0 %}
<urls>{{ doc.urls | join(', ') }}</urls>
{% endif %}
</document>
{% endfor %}
</supporting_documents>
{% endif %}

<execution_workflow>
**Phase 1: Input Analysis and Evidence Collection**
1. Extract input context for integration availability tracking
2. Analyze incident data, correlate logs, review code changes, examine documentation
3. Build comprehensive timeline and identify patterns across data sources
4. Apply systematic root cause methodology with evidence validation

**Phase 2: Artifact Generation**
1. Generate artifacts/index.json with input context tracking and executive summary
2. Generate artifacts/rca.json with complete analysis and possible_solutions
3. Apply contextual CTA logic based on actual input availability
4. Validate schema compliance before completion

**Input Context Processing**:
- incident.provider determines Jira integration capabilities
- source_code repositories enable GitHub PR functionality
- logs sources enhance solution analysis and recommendations
- docs sources enhance Confluence integration features

**Required Deliverables**:
- artifacts/index.json: Summary with input tracking and automation potential
- artifacts/rca.json: Complete analysis with evidence-based conclusions and contextual CTAs
- Progressive disclosure: Start with possible_solutions, detailed solutions generated on-demand
</execution_workflow>

<analysis_focus>
**Investigation Priorities**:
1. **Timeline Construction**: Correlate events across all data sources during incident window
2. **Root Cause Identification**: Apply systematic methodology with evidence validation
3. **Impact Assessment**: Quantify user, business, and technical consequences
4. **Solution Framework**: Generate immediate, short-term, and long-term approaches

**Evidence Quality Assessment**:
- Cross-validate findings using multiple sources when available
- Document confidence levels reflecting evidence strength
- Identify data gaps and their impact on analysis quality
- Support all conclusions with concrete evidence

**Solution Development**:
- Ensure solutions directly address identified root causes
- Provide realistic effort estimates and implementation guidance
- Include validation procedures and rollback plans
- Consider automation opportunities and integration context
</analysis_focus>

<success_criteria>
Generated artifacts should enable stakeholders to:
- Understand exactly what happened and why with appropriate confidence
- Assess business and technical impact with quantified metrics
- Take action on contextually relevant and implementable solutions
- Learn from systematic analysis and prevention recommendations

The analysis must be complete, schema-compliant, and ready for immediate stakeholder consumption and follow-up actions.
</success_criteria>
