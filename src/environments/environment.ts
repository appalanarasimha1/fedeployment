// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // nuxeoServiceBaseUrl: 'https://10.101.21.31:8090', //
  // redirectBaseUrl: 'https://10.101.21.31:8090/', // for redirecting to old nuxeo ui for video playback
  // apiServiceBaseUrl: 'https://10.101.21.31:8090', //
  apiVersion: '/nuxeo/api/v1',
  // apiServiceBaseUrl: 'https://dev2groundx.neom.com', // 'https://uatgroundx.neom.com'
  nuxeoServerUrl: 'https://dev1groundx.neom.com',
  // apiServiceBaseUrl:  "http://34.219.179.33:5050",
  apiServiceBaseUrl: "http://localhost:8090",
  keycloakConfig: {
    url: 'https://keycloak.iotsense-prod-tnd.oci.neomos.online/auth',
    realm: 'GroundX',
    clientId: 'nuxeo-client-public',
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
