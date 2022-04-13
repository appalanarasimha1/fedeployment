const PROXY_CONFIG = [
    {
        "context": [
            "/nuxeo/",
            "/sockjs-node/",
        ],
        "target":
         "http://localhost:8080",
        // "https://uatgroundx.neom.com", //"https://34.219.179.33:5050",  'https://uatgroundx.neom.com',//  
        "secure": false,
        "changeOrigin": true
    }];

module.exports = PROXY_CONFIG;