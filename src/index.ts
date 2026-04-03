import { routeAgentRequest } from "agents";
import { PolicyGuardAgent } from "./agent";

export { PolicyGuardAgent };

type Env = {
  AI: Ai;
  AGENT: DurableObjectNamespace;
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) return agentResponse;
    return new Response("Not Found", { status: 404 });
  },
};
