const PROXY_CONFIG = [
    {
        "context": [
            "/nuxeo/",
            "/sockjs-node/",
        ],
        "target": "https://uatgroundx.neom.com", // "https://dev2groundx.neom.com/", //"https://34.219.179.33:5050",
        "secure": false,
        "changeOrigin": true
    }];

module.exports = PROXY_CONFIG;