// Extends app.json. Android push needs Firebase's google-services.json, which
// isn't committed: EAS builds get it from the GOOGLE_SERVICES_JSON file
// variable, local builds from ./google-services.json. Without it the app still
// builds; Android phones just can't register for push.
const fs = require('fs');

module.exports = ({ config }) => {
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON || (fs.existsSync('./google-services.json') ? './google-services.json' : undefined);

  if (!googleServicesFile) {
    console.warn('[app.config] No google-services.json: Android push notifications are off in this build.');
  }

  return {
    ...config,
    android: { ...config.android, ...(googleServicesFile ? { googleServicesFile } : {}) },
  };
};
