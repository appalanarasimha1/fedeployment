export const environment = {
    production: true,
    apiServiceBaseUrl: 'https://uatgroundx.neom.com',
    nuxeoServerUrl: 'https://uatgroundx.neom.com',
    apiVersion: '/nuxeo/api/v1',
    keycloakConfig: {
      url: "devkeycloak.oci.sense.neomos.online", // 'https://devkeycloak.the-it-cloud.net/auth/',
      realm: 'GroundX',
      clientId: 'nuxeo-client-public',
    }
  };
  import 'zone.js/dist/zone-error';  // Included with Angular CLI.