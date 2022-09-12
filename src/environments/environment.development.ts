// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --configuration development` replaces `environment.ts` with `environment.development.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    apiVersion: '/nuxeo/api/v1',
    apiServiceBaseUrl: 'https://dev2groundx.neom.com', 
    nuxeoServerUrl: 'https://dev2groundx.neom.com',
    // apiServiceBaseUrl:  "http://34.219.179.33:5050",
    keycloakConfig: {
        url: "https://devkeycloak.oci.sense.neomos.online/auth/", // 'https://devkeycloak.the-it-cloud.net/auth/',
        realm: 'GroundX',
        clientId: 'nuxeo-client-public',
    }
  };