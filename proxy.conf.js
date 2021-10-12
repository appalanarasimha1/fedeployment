const PROXY_CONFIG = [
    {
        "context": [
            "/nuxeo/",
            "/sockjs-node/",
        ],
        "target": "https://10.101.21.31:8080",
        "secure": false,
        "changeOrigin": true
    }];

module.exports = PROXY_CONFIG;