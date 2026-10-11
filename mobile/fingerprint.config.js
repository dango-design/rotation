/* What decides whether an over-the-air update fits an installed build (app.json's runtimeVersion uses the fingerprint
   policy). app.config.js puts the branch and commit in `extra`, which changes with every commit but not the native
   code, so it's left out. Otherwise no update would ever match a build made from an earlier commit. Expo's default
   skip stays too: EAS Build's prebuild rewrites the android and ios scripts in package.json. */

const { SourceSkips } = require('expo/fingerprint');

/** @type {import('expo/fingerprint').Config} */
module.exports = {
  sourceSkips: SourceSkips.PackageJsonAndroidAndIosScriptsIfNotContainRun | SourceSkips.ExpoConfigExtraSection,
};
