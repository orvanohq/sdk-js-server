// Spec 0005 NPM-6: the version is compiled in by tsdown's `define`, never read from package.json at run time.
// oxlint-disable-next-line no-underscore-dangle -- NPM-6 names this build time constant
declare const __ORVANO_SDK_VERSION__: string;

/**
 * This package's version.
 * @public
 */
// oxlint-disable-next-line no-underscore-dangle -- NPM-6 names this build time constant
export const sdkVersion: string = __ORVANO_SDK_VERSION__;
