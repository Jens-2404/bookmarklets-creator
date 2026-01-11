# AI Phase Plan (Post-MVP)

This plan covers optional AI features that do not block MVP delivery.

## Scope
- Natural language -> bookmarklet code generation.
- Explain mode for existing code (learning focus).
- Prompt library with vetted templates.

## Non-goals
- No backend accounts or sharing.
- No auto-run of AI code without user review.
- No direct access to user browsing data.

## Principles
- Safety first: warn, do not silently run risky code.
- Transparency: show generated code and why it is safe.
- Learnability: help users understand the code.

## User Flows
### 1) Create with AI
1. User clicks "Create with AI".
2. User enters a natural language task.
3. App returns code + short explanation.
4. Code is inserted into editor (not auto-run).
5. Validator runs; warnings shown.
6. User can edit, then Generate -> Preview -> Save.

### 2) Explain mode
1. User clicks "Explain this code".
2. App returns plain-English summary and key API notes.
3. App highlights risky or unclear parts.

### 3) Prompt library
1. User opens preset list (DOM, SEO, Content, Debug).
2. Picks a template and fills placeholders.
3. Template becomes the AI prompt.

## Prompt Templates (examples)
### System prompt
You are a JavaScript expert for browser bookmarklets.
Rules:
- No network requests.
- No eval or Function constructors.
- Use only standard DOM APIs.
Return only JavaScript code.

### User prompt
Task: {USER_PROMPT}
Constraints:
- Keep it short and readable.
- Avoid external dependencies.

### Explain prompt
Explain the following bookmarklet code in plain English.
Highlight any risky APIs and suggest safer alternatives.

## Guardrails
- Max code length (e.g., 4000 chars).
- Reject if output contains banned patterns (eval, fetch, XHR).
- Require user confirmation before preview.
- Always show diffs when regenerating.

## Quality Checks
- Syntax check before showing code.
- Lint/validator warnings visible.
- "I understand" acknowledgment for risky APIs.
- Basic test snippets for common DOM tasks.

## Integration Points
- AI output goes into editor as source code.
- Generator pipeline unchanged (minify -> encode).
- Preview uses existing sandbox.
- Stored as normal bookmarklets.

## Data Handling
- No automatic upload of user code by default.
- If a remote AI API is used, show a clear consent dialog.
- Log only anonymous event counts (no code content).

## Open Questions
- Which AI provider (OpenAI, local, or BYOK)?
- Do we support multiple variants per prompt?
- How much explanation detail is useful by default?
