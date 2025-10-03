<task>
Process the user feedback and apply appropriate actions to the existing ticket hierarchy.
</task>

<user_feedback>
{{ user_feedback }}
</user_feedback>

<request_analysis>
<message>🔄 Analyzing request...</message>

<request_type>
{% if 'For Epic:' in user_feedback or 'For Story:' in user_feedback or 'For Task:' in user_feedback %}
TYPE: TARGETED_MODIFICATION
- Extract ticket ID and requested improvements
- Apply changes to specific ticket only

{% elif 'Publish to Jira' in user_feedback or 'Publish to JIRA' in user_feedback %}
TYPE: PUBLISH_TO_JIRA
- Extract project key and board information
- Use MCP to create tickets in JIRA
- Update artifacts with returned JIRA keys and IDs immediately after each issue is created (no batching)

{% else %}
TYPE: ADHOC_REQUEST
- Respond naturally to user's request
- If it's about tickets, apply changes
- If it's a question, answer it
- If unclear or unrelated, politely clarify

{% endif %}
</request_type>
</request_analysis>

<execution>
{% if 'For Epic:' in user_feedback or 'For Story:' in user_feedback or 'For Task:' in user_feedback %}
<targeted_modification>
<message>✏️ Applying targeted modifications...</message>

1. Parse the feedback to extract:
   - Ticket type and ID from pattern "For [Type]: [ID],"
   - Improvement request after "improvements:"

2. Locate the specific ticket in hierarchy

3. Apply requested changes:
   - Update fields as requested
   - Maintain schema compliance
   - Preserve unchanged fields

4. Report only the changes made to that specific ticket
</targeted_modification>

{% elif 'Publish to Jira' in user_feedback or 'Publish to JIRA' in user_feedback %}
<jira_publishing>
<message>🚀 Publishing tickets to JIRA...</message>

1. **Validate Project** - Use `mcp__atlassian__getVisibleJiraProjects` with cloudId and project key

2. **Create Epic** - Use `mcp__atlassian__createJiraIssue` with `issueTypeName: "Epic"`
   - Update artifact immediately with returned jira_key and jira_id

3. **Create Stories** - Use `mcp__atlassian__createJiraIssue` with `issueTypeName: "Story"`
   - Link to Epic: `additional_fields: {"parent": {"key": "[EPIC_KEY]"}}`
   - Update each Story artifact immediately

4. **Create Tasks** - Use `mcp__atlassian__createJiraIssue` with `issueTypeName: "Task"`
   - Link to Epic: `additional_fields: {"parent": {"key": "[EPIC_KEY]"}}`
   - Update each Task artifact immediately

**Key Rules:**
- Both Tasks and Stories use `additional_fields.parent.key` to link to Epic 
- Priority: exact names "High", "Medium", "Low"
- Skip estimation fields if they error
- Update artifacts immediately: state="created", add jira_key + jira_id
- Add labels from the labels field to each Epic, Story, and Task if present
</jira_publishing>

{% else %}
<adhoc_request>
<message>📝 Processing request...</message>

Handle the user's request naturally:
- Answer questions about the tickets
- Make ticket changes if requested
- Provide helpful information
- Have a normal conversation
- Only ask for clarification if genuinely confused
</adhoc_request>
{% endif %}
</execution>

<response_format>
{% if 'For Epic:' in user_feedback or 'For Story:' in user_feedback or 'For Task:' in user_feedback %}
{# Targeted Modification - Formal report for specific ticket change #}
# Ticket Modification Report

## Modified: [Ticket ID] - [Title]

### Changes Applied
[List the specific changes made based on the improvement request]

### Validation
✅ Changes comply with requirements
✅ Relationships maintained

### Next Steps
Review the updated ticket and request additional changes if needed.

{% elif 'Publish to Jira' in user_feedback or 'Publish to JIRA' in user_feedback %}
{# JIRA Publishing - Detailed publishing report with JIRA keys #}
# JIRA Publishing Report

## Configuration
- **Project**: [Extracted Project Key]
- **Board**: [Board Name] (ID: [Board ID])
{% if 'sprint' in user_feedback or 'Sprint' in user_feedback %}
- **Sprint**: [Sprint Name/ID]
{% endif %}

## Publishing Results

### Epics Created
- EP01 → PROJ-101: [Title]
- EP02 → PROJ-102: [Title]

### Tasks Created
Under PROJ-101:
- T01 → PROJ-103: [Title]
- T02 → PROJ-104: [Title]

### Stories Created
Under PROJ-101:
- S01 → PROJ-103: [Title]
- S02 → PROJ-104: [Title]

## Summary
✅ Successfully created [X] tickets in JIRA
✅ All artifacts updated with JIRA keys and IDs
✅ States updated to "created"
✅ Parent-child relationships maintained in JIRA

## Next Steps
- View tickets in JIRA board
- Begin sprint planning
- Assign team members

{% else %}
{# Ad-hoc Request - Natural, conversational response #}
{# Don't force a report format. Just respond naturally to what the user needs. #}
{# Examples: #}
{# - "Sure, I'll add that story..." #}
{# - "You have 5 stories in EP01 with a total of 23 points" #}
{# - "The authentication epic covers user login, registration, and password reset" #}
{# - "I'm not sure what you're asking. Could you clarify?" #}
{% endif %}
</response_format>

<mcp_usage_note>
**JIRA Publishing Tools:**
- `mcp__atlassian__getVisibleJiraProjects` - Validate project  
- `mcp__atlassian__createJiraIssue` - Create issues

**Critical Rules:**
- Epic: `issueTypeName: "Epic"`
- Story: `issueTypeName: "Story"` + `additional_fields: {"parent": {"key": "EPIC-KEY"}}`  
- Task: `issueTypeName: "Task"` + `additional_fields: {"parent": {"key": "EPIC-KEY"}}`  
- Set parent links using JIRA keys (not internal IDs)
- Attach labels if provided
- Priority: Use exact names "High", "Medium", "Low"
- Persist jira_key and jira_id immediately after each creation (no batching)

**Performance Optimization:**
- Use SUBAGENTS to parallelize epic creation - spawn one subagent per epic
- Each subagent handles: epic creation → task creation, story creation for its epic
- Keep within-epic creation sequential to maintain parent-child relationships
</mcp_usage_note>

<instruction>
Process the user feedback appropriately based on its type.
</instruction>