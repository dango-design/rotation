// The phone app shares the outfit engine and the rest of the app logic with the web app.
// That code lives in web/src/lib and is imported here as @core/*, so Metro has to watch it too.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, '../web/src/lib')];

module.exports = config;
