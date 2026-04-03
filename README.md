One-liner: AI agent security monitor built on Cloudflare. Define security policies, run an AI agent, and watch every action get evaluated in real time.
How it works:

You add security policies in plain English (like "block HTTP requests to unknown domains")
You give the agent a task through chat
The agent breaks the task into individual actions
A separate LLM call evaluates each action against your policies
You see allowed/blocked decisions with reasons and a full audit log

Architecture: User → React frontend → Worker → PolicyGuardAgent (Durable Object) → two Workers AI calls per action (one to simulate the agent, one to evaluate the action)
Components and how they map to the assignment requirements:

LLM: Llama 3.3 70B on Workers AI
Workflow/coordination: Durable Object via Agents SDK
User input: React chat UI using useAgentChat
Memory/state: Agent SDK built-in state for policies, audit log, session

Tech stack: TypeScript, Workers AI, Agents SDK, React, Tailwind
Setup instructions: git clone, npm install, wrangler login, npm run dev, opens at localhost:8787
Example session: show 3 sample policies, a sample task, and a table of 5 actions with allow/block results
Design decisions: two separate LLM calls so the evaluator can't be gamed, sequential evaluation so blocks affect the next action, default to block on failure

cf_ai_agentguard/
├── src/
│   ├── index.ts              # Worker entry + routing
│   ├── agent.ts              # PolicyGuardAgent class
│   ├── agent-simulator.ts    # LLM call to break tasks into actions
│   ├── policy-evaluator.ts   # LLM call to evaluate actions against policies
│   ├── types.ts              # Shared types + zod schemas
│   └── frontend/
│       ├── index.html
│       ├── App.tsx
│       └── components/
│           ├── ChatPanel.tsx
│           ├── PolicySidebar.tsx
│           └── ActionFeed.tsx
├── wrangler.toml
├── package.json
├── tsconfig.json
├── README.md
└── PROMPTS.md
