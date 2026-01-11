# AI UI Outline (Post-MVP)

## Entry Points
- Primary CTA: "Create with AI" next to Generate.
- Secondary CTA: "Explain code" near the editor.

## Create with AI (Panel)
- Input: multi-line prompt.
- Options:
  - Category (DOM, SEO, Content, Debug)
  - Output length (Short / Medium)
- Actions: Generate, Insert to Editor, Cancel.
- States:
  - Loading (spinner + cancel)
  - Error (retry + view details)
  - Result (code + summary + warnings)

## Explain Mode (Side Sheet)
- Summary (3-5 bullets)
- API list (DOM APIs used)
- Risk notes (validator warnings)
- Actions: Insert comments, Close

## Fallbacks
- If AI unavailable: show "AI not configured" with setup link.
- If response violates guardrails: show "Safety block" + reason.

## Copy & Audit
- Always show generated code and highlight diffs.
- Never auto-run generated code.
