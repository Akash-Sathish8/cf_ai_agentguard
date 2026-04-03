import { routeAgentRequest } from "agents";
import { PolicyGuardAgent } from "./agent";

export { PolicyGuardAgent };

type Env = {
  AI: Ai;
  AGENT: DurableObjectNamespace;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) return agentResponse;
    return env.ASSETS.fetch(request);
  },
};
