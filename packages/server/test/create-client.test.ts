// Spec 0005 SHP-1, NPM-6, KEY-3: createClient and the request every service sends. The shared runtime (transport,
// retry, errors) has its full SQA-7 suite in orvano's generator tests, on the same template code.
import { describe, expect, it } from "vitest";
import { apiVersion, createClient, Health, OrvanoError, sdkVersion } from "../src/index.js";

function recorder(response: () => Response): {
  fetch: (request: Request) => Promise<Response>;
  requests: Request[];
} {
  const requests: Request[] = [];
  return {
    requests,
    fetch: (request) => {
      requests.push(request);
      return Promise.resolve(response());
    },
  };
}

const ok = (): Response =>
  new Response(JSON.stringify({ status: "ok", apiVersions: [apiVersion] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

describe("createClient", () => {
  it("0014 AC-18: health sends the version, the server identity, and the key", async () => {
    const http = recorder(ok);
    const client = createClient({
      url: "https://orvano.example.com",
      key: "sk_test",
      fetch: http.fetch,
    });
    await expect(new Health(client).get()).resolves.toEqual({
      status: "ok",
      apiVersions: [apiVersion],
    });
    const [sent] = http.requests;
    expect(sent?.url).toBe("https://orvano.example.com/v1/health");
    expect(sent?.headers.get("Orvano-Api-Version")).toBe(apiVersion);
    expect(sent?.headers.get("Orvano-Client")).toBe(`server/${sdkVersion}`);
    expect(sent?.headers.get("Orvano-Key")).toBe("sk_test");
  });

  it("refuses a missing key and a bad url at once", () => {
    // @ts-expect-error the key is required
    expect(() => createClient({ url: "https://orvano.example.com" })).toThrow(TypeError);
    expect(() => createClient({ url: "http://orvano.example.com", key: "k" })).toThrow(TypeError);
  });

  it("never shows the key on the client handle (KEY-3)", () => {
    const client = createClient({ url: "https://orvano.example.com", key: "sk_secret_value" });
    expect(JSON.stringify(client)).not.toContain("sk_secret_value");
  });

  it("reports failures as OrvanoError", async () => {
    const http = recorder(() => new Response("", { status: 503 }));
    const client = createClient({
      url: "https://a.example",
      key: "k",
      fetch: http.fetch,
      retry: { maxRetries: 0 },
    });
    const error: unknown = await new Health(client).get().catch((thrown: unknown) => thrown);
    expect(OrvanoError.is(error) && error.kind).toBe("server");
  });
});
