const PROXY_CONFIG = [
    {
        "context": [
            "/nuxeo/",
            "/sockjs-node/",
        ],
        "target": 'http://localhost:8090',//"https://dev2groundx.neom.com", //"https://34.219.179.33:5050",    
        // "target": 'https://dev2groundx.neom.com',//"https://uatgroundx.neom.com", //"https://34.219.179.33:5050",    
        "secure": false,
        "changeOrigin": true
    }];

module.exports = PROXY_CONFIG;