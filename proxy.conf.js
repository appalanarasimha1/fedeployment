const PROXY_CONFIG = [
    {
        "context": [
            "/nuxeo/",
            "/sockjs-node/",
        ],
        "target": "https://tomcat-groundx.neom.com:8087",
        "secure": false,
        "changeOrigin": true
    }];

module.exports = PROXY_CONFIG;