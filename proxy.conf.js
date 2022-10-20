const PROXY_CONFIG = [
    {
        "context": [
            "/nuxeo/",
            "/sockjs-node/",
        ],
        "target": 'https://uatgroundx.neom.com', // "https://uatgroundx.oci.sense.neomos.online", // 
        "secure": false,
        "changeOrigin": true
    }];

module.exports = PROXY_CONFIG;