const PROXY_CONFIG = [
    {
        "context": [
            "/nuxeo/",
            "/sockjs-node/",
        ],
        "target": {
            "host": "10.101.21.63",
            "protocol": "https:",
            "port": 8087
        },
        "secure": false,
        "changeOrigin": true
    }];

module.exports = PROXY_CONFIG;