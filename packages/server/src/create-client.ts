import { OrvanoHeaders } from "./generated/contract.js";
import type { OrvanoClient } from "./runtime/client.js";
import { createClientHandle, type CommonClientOptions } from "./runtime/options.js";
import { sdkVersion } from "./version.js";

/**
 * Options for `createClient` (spec 0005 SHP-1). A user `session` credential arrives with feature 21.
 * @public
 */
export interface ClientOptions extends CommonClientOptions {
  /** The project's secret key, sent as `Orvano-Key` on every request (spec 0014 HDR-1). Keep it on the server. */
  readonly key: string;
}

/**
 * Opens a server client for one Orvano project. It does no I/O; pass it to each service's constructor.
 * Throws `TypeError` at once for a bad option.
 * @public
 */
export function createClient(options: ClientOptions): OrvanoClient {
  const given: unknown = options;
  if (typeof given !== "object" || given === null) {
    throw new TypeError("createClient needs an options object.");
  }
  const key: unknown = options.key;
  if (typeof key !== "string" || key === "") {
    throw new TypeError("key must be the project's secret key.");
  }
  return createClientHandle(options, `server/${sdkVersion}`, { [OrvanoHeaders.orvanoKey]: key });
}
