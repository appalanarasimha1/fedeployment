const PROXY_CONFIG = [
    {
        "context": [
            "/nuxeo/",
            "/sockjs-node/",
        ],
        "target": "https://uatgroundx.neom.com",    // "https://dev2groundx.neom.com",
        "secure": false,
        "changeOrigin": true
    }];

module.exports = PROXY_CONFIG;