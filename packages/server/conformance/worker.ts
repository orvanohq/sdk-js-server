// Spec 0005 SQA-3: the test worker. conformance/workerd.test.ts bundles it and runs it under Miniflare; each request
// runs one scenario inside workerd and answers its mismatches, so the SDK runs on the real Workers runtime.
import { runScenario, type BootstrappedProject, type Scenario } from "./runner.js";

interface RunRequest {
  readonly scenario: Scenario;
  readonly stubUrl: string;
  readonly liveUrl: string;
  readonly project?: BootstrappedProject;
}

/** The worker's fetch handler. */
export async function handle(request: Request): Promise<Response> {
  const { scenario, stubUrl, liveUrl, project } = (await request.json()) as RunRequest;
  const problems = await runScenario(scenario, {
    stubUrl,
    liveUrl,
    project,
    fetch: (outbound) => fetch(outbound),
  });
  return Response.json(problems);
}

const worker: { fetch: (request: Request) => Promise<Response> } = { fetch: handle };

// oxlint-disable-next-line import/no-default-export -- workerd loads a module worker through its default export
export default worker;
