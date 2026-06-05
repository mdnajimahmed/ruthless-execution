const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const crypto = require('crypto');

const config = getDefaultConfig(__dirname);

// EXPO_PUBLIC_ vars are inlined by Babel at transform time, but Metro's cache key
// doesn't include them — so switching URLs reuses stale cached transforms.
// Hashing the current EXPO_PUBLIC_ values into cacheVersion forces a cache bust
// whenever any of them change.
const publicEnvHash = crypto
  .createHash('md5')
  .update(
    JSON.stringify(
      Object.fromEntries(
        Object.entries(process.env).filter(([k]) => k.startsWith('EXPO_PUBLIC_'))
      )
    )
  )
  .digest('hex');

config.cacheVersion = `${config.cacheVersion ?? ''}+env:${publicEnvHash}`;

module.exports = withNativeWind(config, { input: './global.css' });
