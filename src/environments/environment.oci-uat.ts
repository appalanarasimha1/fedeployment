// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --oci-uat` replaces `environment.ts` with `environment.oci-uat.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  nuxeoServerUrl: 'https://groundx.oci.sense.neomos.online',
  apiServiceBaseUrl: 'https://groundx.oci.sense.neomos.online',
  apiVersion: '/nuxeo/api/v1',
  keycloakConfig: {
    url: 'https://groundx.the-it-cloud.net/auth/',
    realm: 'GroundX',
    clientId: 'nuxeo-client-public',
  }
};
import 'zone.js/dist/zone-error';  // Included with Angular CLI.