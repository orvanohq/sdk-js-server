// Spec 0005 SQA-3: the test worker under Deno or Bun. conformance/spawned.test.ts bundles this and starts it. The first
// line it prints is the port, and each request runs one scenario inside that runtime.
import { handle } from "./worker.js";

interface Runtimes {
  readonly Deno?: {
    serve(
      options: { hostname: string; port: number; onListen: () => void },
      handler: typeof handle,
    ): { addr: { port: number } };
  };
  readonly Bun?: {
    serve(options: { hostname: string; port: number; idleTimeout: number; fetch: typeof handle }): {
      port: number;
    };
  };
}

function listen(): number {
  const { Deno, Bun } = globalThis as Runtimes;
  const hostname = "127.0.0.1";
  if (Deno !== undefined)
    return Deno.serve({ hostname, port: 0, onListen: () => undefined }, handle).addr.port;
  // idleTimeout 0: Bun otherwise drops a request after 10 seconds, and a scenario's retries can wait longer.
  if (Bun !== undefined)
    return Bun.serve({ hostname, port: 0, idleTimeout: 0, fetch: handle }).port;
  throw new Error("conformance/serve.ts runs under Deno or Bun.");
}

// oxlint-disable-next-line no-console -- conformance/spawned.test.ts reads the port from this line
console.log(listen());
