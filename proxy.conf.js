const PROXY_CONFIG = [
    {
        "context": [
            "/nuxeo/",
            "/sockjs-node/",
        ],
        "target": "http://10.101.21.58:8089",
        "secure": false,
        "changeOrigin": true
    }];

module.exports = PROXY_CONFIG;