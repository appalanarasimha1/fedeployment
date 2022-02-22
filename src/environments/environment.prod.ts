// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,
  nuxeoServerUrl: 'https://groundx.neom.com',
  apiServiceBaseUrl: 'https://groundx.neom.com',
  apiVersion: '/nuxeo/api/v1',
  keycloakConfig: {
    url: 'https://keycloakgxprod.iotsense-prod-tnd.oci.neomos.online/auth', //'https://keycloak.iotsense-prod-tnd.oci.neomos.online/auth',
    realm: 'GroundX',
    clientId: 'nuxeo-client-public',
  }
};
import 'zone.js/dist/zone-error';  // Included with Angular CLI.