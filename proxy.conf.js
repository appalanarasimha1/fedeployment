const PROXY_CONFIG = [
    {
        "context": [
            "/nuxeo/",
            "/sockjs-node/",
        ],
        "target":"https://uatgroundx.oci.sense.neomos.online", // 'https://uatgroundx.neom.com', 
        "secure": false,
        "changeOrigin": true
    }];

module.exports = PROXY_CONFIG;