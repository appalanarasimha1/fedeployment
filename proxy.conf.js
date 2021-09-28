const PROXY_CONFIG = [
    {
        "context": [
            "/nuxeo/",
            "/sockjs-node/",
        ],
        "target": {
            "host": "tomcat-groundx.neom.com",
            "protocol": "https:",
            "port": 8087
        },
        "secure": false,
        "changeOrigin": true
    }];

module.exports = PROXY_CONFIG;