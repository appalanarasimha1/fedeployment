export const environment = {
  // production: true,
  // nuxeoServiceBaseUrl: 'http://10.101.21.31:8080',
  // redirectBaseUrl: 'https://devtomcat-groundx.neom.com:8090/', // for redirecting to old nuxeo ui for video playback
  // apiServiceBaseUrl: 'http://10.101.21.31:8080',
  // apiVersion: '/nuxeo/api/v1'

  nuxeoServerUrl: 'https://groundx.neom.com',
  production: true,
  apiServiceBaseUrl: 'https://groundx.neom.com',
  apiVersion: '/nuxeo/api/v1',
  keycloakConfig: {
    url: 'https://keycloak.iotsense-prod-tnd.oci.neomos.online/auth',
    realm: 'GroundX',
    clientId: 'nuxeo-client-public',
  }
};
