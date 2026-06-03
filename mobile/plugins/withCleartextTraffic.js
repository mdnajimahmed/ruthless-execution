const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

// Adds android:usesCleartextTraffic="true" and networkSecurityConfig to
// the <application> tag, and writes the network_security_config.xml file.
// Required because Expo SDK 56 prebuild does not apply usesCleartextTraffic
// from app.json to the manifest reliably.

const withCleartextTraffic = (config) => {
  // 1. Patch AndroidManifest
  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application[0].$;
    app['android:usesCleartextTraffic'] = 'true';
    app['android:networkSecurityConfig'] = '@xml/network_security_config';
    return cfg;
  });

  // 2. Write network_security_config.xml
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const xmlDir = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDir, 'network_security_config.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system"/>
    </trust-anchors>
  </base-config>
</network-security-config>
`,
      );
      return cfg;
    },
  ]);

  return config;
};

module.exports = withCleartextTraffic;
