// Spec 0005 SQA-3: every server scenario inside workerd, through Miniflare.
import { Miniflare } from "miniflare";
import { describeHosted } from "./hosted.js";

describeHosted("./worker.ts", async (script) => {
  const miniflare = new Miniflare({ modules: true, script, compatibilityDate: "2026-07-01" });
  await miniflare.ready;
  return {
    run: async (scenario) => {
      const answer = await miniflare.dispatchFetch("http://worker/run", {
        method: "POST",
        body: scenario,
      });
      return answer.json();
    },
    dispose: () => miniflare.dispose(),
  };
});
