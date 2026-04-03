
AI-assisted coding was done with Claude Code (Anthropic). This log covers the main prompts used. All output was reviewed and modified before committing.

## 1. Project Scaffold

**Prompt:**
> Scaffold a Cloudflare Workers project using the Agents SDK. Set up wrangler.toml with Workers AI binding and a Durable Object class, TypeScript config, package.json with agents, Vercel AI SDK, workers-ai-provider, zod, React. Get wrangler dev starting clean.

**What I changed:** Added nodejs_compat to compatibility_flags which was missing. Fixed the [assets] directory path in wrangler.toml to point to the right build output folder.

---

## 2. Shared Types

**Prompt:**
> Create a types.ts with interfaces for AgentAction (type, params, description), AuditEntry (id, timestamp, action fields, verdict fields), AgentState (policies, audit_log, current_task), and a zod schema for validating policy evaluation responses.

**What I changed:** Added the confidence field (0-1) to the zod schema. The generated version only had allowed, reason, and matched_policy.

---

## 3. Agent Action Simulator

**Prompt:**
> Build a module that takes a task string, calls Llama 3.3 70B on Workers AI, and gets back a JSON array of 3-6 discrete actions the agent would take. Handle malformed JSON with a retry using a stricter prompt. Fall back to an error action if both attempts fail.

**What I changed:** The retry prompt was too similar to the original. Rewrote it to explicitly say "Your last response was not valid JSON" and "start with [ and end with ]". Also added markdown fence stripping before JSON.parse since the model kept wrapping output in ```json blocks.

---

## 4. Policy Evaluation Engine

**Prompt:**
> Build a module that evaluates a single agent action against a list of plain-text security policies using a separate Llama 3.3 call. Return allowed/blocked with reason. Validate output with zod. Retry with exponential backoff on failure. Default to block if all retries fail.

**What I changed:** The system prompt included "the agent is trying to accomplish a task" which leaks context to the evaluator. Removed that line so the evaluator only sees the action and policies, never the broader task. Added random jitter to the backoff to avoid retry storms.

---

## 5. PolicyGuardAgent Class

**Prompt:**
> Create the main agent class extending AIChatAgent from the Agents SDK. Add callable methods for managing policies and audit log. Implement onChatMessage to run the full loop: simulate actions, evaluate each one sequentially against policies, update state after each evaluation for real-time frontend updates, stream results back.

**What I changed:** The generated version updated state once at the end instead of after each action evaluation. Moved the setState call inside the loop so the frontend audit feed updates in real time. Also added a guard to reject new tasks while one is already running, and a finally block to always reset current_task to null even on errors.

---

## 6. Worker Entry Point and Routing

**Prompt:**
> Set up the Worker entry in index.ts. Export the agent class, use routeAgentRequest from the agents SDK to handle WebSocket and RPC traffic, fall through to static assets for the frontend.

**What I changed:** Nothing major. Added the Env interface type that was missing.

---

## 7. React Frontend

**Prompt:**
> Build a three-panel React frontend. Left sidebar for adding/removing policies via agent.stub calls. Center chat panel using useAgentChat. Right panel showing the audit log from agent state via onStateUpdate. Dark security dashboard theme with JetBrains Mono for the action feed.

**What I changed:** Restyled significantly. The generated version used default Tailwind grays which looked flat. Switched to a darker base (#0a0a0f), added colored left borders on audit entries instead of full background tints, added a pulsing dot animation for the "evaluating" state, and made audit entries show newest first. Fixed the useAgentChat import path which was pointing to the wrong module.

---

## 8. Error Handling and Polish

**Prompt:**
> Add error handling across the codebase. Try/catch on all Workers AI calls, loading states in the UI, connection status indicator, proper CSV escaping, empty states for the audit feed.

**What I changed:** The connection status used a polling interval to check readyState. Replaced it with the useAgent hook's built-in connection state. Fixed CSV export where params field was outputting [object Object] instead of JSON.

---

## 9. README

**Prompt:**
> Write a README with project description, mermaid architecture diagram, setup instructions, example session, and design decisions.

**What I changed:** Rewrote the design decisions section. The generated version was generic. Added specific reasoning about why the evaluator and simulator share no context (prevents gaming), why we default to block on failure (fail-closed), and why Durable Objects over KV (ordered writes + WebSocket coordination).

---

## Notes

- About 40% of the final code was written or rewritten without AI. The core areas I wrote myself: policy evaluation prompt engineering, the sequential orchestration loop with real-time state updates, and most of the frontend styling.
- AI was most useful for: wrangler config, zod schemas, boilerplate route handling, CSV conversion, React component structure.
- AI was least useful for: getting the LLM to return clean JSON reliably (required manual prompt iteration), real-time state sync timing (had to move setState into the loop manually), and the evaluator prompt design (domain knowledge from my work on Arceo).
