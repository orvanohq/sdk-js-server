// Spec 0005 KEY-1: what a browser or React Native bundle gets instead of @orvano/server (the `browser` and
// `react-native` conditions, NPM-2). It throws as soon as it is imported, and exports a stub under every public value
// name, so a bundler reports this message rather than a missing export. test/browser-guard.test.ts checks the names
// against src/index.ts, so a new service fails that test until its stub is added here.
const message =
  "@orvano/server holds a secret key and must never ship to a browser or a device. Use @orvano/client there.";

function refuse(): never {
  throw new Error(message);
}

refuse();

/** @public */
export const apiVersion: string = message;
/** @public */
export const sdkPackage: string = message;
/** @public */
export const sdkVersion: string = message;
/** @public */
export const OrvanoHeaders: Readonly<Record<string, string>> = {};
/** @public */
export const OrvanoErrorCodes: Readonly<Record<string, string>> = {};

/** @public */
export function createClient(): never {
  return refuse();
}

/** @public */
export function Health(): never {
  return refuse();
}

/** @public */
export class OrvanoError extends Error {
  constructor() {
    super(message);
    refuse();
  }
}
