// Extends app.json. On EAS, google-services.json comes from the GOOGLE_SERVICES_JSON secret file
// (it is gitignored); locally the file in the project root is used.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
});
