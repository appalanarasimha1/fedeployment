const PROXY_CONFIG = [
    {
        "context": [
            "/nuxeo/",
            "/sockjs-node/",
        ],
        "target":
        "https://uatgroundx.neom.com",
        // "https://groundx.neom.com",
        //  "http://localhost:8080",
        // "https://uatgroundx.oci.sense.neomos.online", //"https://34.219.179.33:5050",  'https://uatgroundx.neom.com',///
        "secure": false,
        "changeOrigin": true
    }];

module.exports = PROXY_CONFIG;