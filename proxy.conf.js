const PROXY_CONFIG = [
    {
        "context": [
            "/nuxeo/",
            "/sockjs-node/",
        ],
        "target": "https://34.219.179.33:5050",    // "https://dev2groundx.neom.com",
        "secure": false,
        "changeOrigin": true
    }];

module.exports = PROXY_CONFIG;