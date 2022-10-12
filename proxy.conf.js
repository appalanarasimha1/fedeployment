const PROXY_CONFIG = [
    {
        "context": [
            "/nuxeo/",
            "/sockjs-node/",
        ],
<<<<<<< HEAD
        "target":"https://uatgroundx.oci.sense.neomos.online", // 'https://uatgroundx.neom.com', 
=======
        "target":
        // "https://groundx.neom.com",
        //  "http://localhost:8080",
        "https://uatgroundx.oci.sense.neomos.online", //"https://34.219.179.33:5050",  'https://uatgroundx.neom.com',///
>>>>>>> origin/umesh_sprint38
        "secure": false,
        "changeOrigin": true
    }];

module.exports = PROXY_CONFIG;