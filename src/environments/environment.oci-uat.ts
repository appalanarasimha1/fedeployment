// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --oci-uat` replaces `environment.ts` with `environment.oci-uat.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  nuxeoServerUrl: "https://uatgroundx.oci.sense.neomos.online", // 'https://uatgroundx.oci.sense.neomos.online',
  apiServiceBaseUrl: "https://uatgroundx.oci.sense.neomos.online", // 'https://uatgroundx.neom.com',
  apiVersion: '/nuxeo/api/v1',
  keycloakConfig: {
    url:  "https://devkeycloak.oci.sense.neomos.online/auth/", // 'https://groundxkeycloak.oci.sense.neomos.online/auth/',
    realm: 'GroundX',
    clientId: 'nuxeo-client-public',
  }
};
import 'zone.js/dist/zone-error';  // Included with Angular CLI.