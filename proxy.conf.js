const PROXY_CONFIG = [
    {
        "context": [
            "/nuxeo/",
            "/sockjs-node/",
        ],
        "target": "https://dev2groundx.neom.com" , //"https://groundx.neom.com", //"https://34.219.179.33:5050",    
        "secure": false,
        "changeOrigin": true
    }];

module.exports = PROXY_CONFIG;