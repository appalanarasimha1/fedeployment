"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteManager = void 0;
var path = __importStar(require("path"));
var express = __importStar(require("express"));
var http_proxy_middleware_1 = require("http-proxy-middleware");
var allowedExt = [
    '.js',
    '.ico',
    '.css',
    '.png',
    '.jpg',
    '.woff2',
    '.woff',
    '.ttf',
    '.svg',
    '.eot'
];
var RouteManager = /** @class */ (function () {
    function RouteManager(app) {
        this.targetUrl = process.env.NODE_ENV === 'demo' ? 'https://10.101.21.58:8089' : 'https://tomcat-groundx.neom.com:8087';
        this.app = app;
        this.mountRoutes(app);
    }
    /**
     * Function to mount all the application routes under express application.
     */
    RouteManager.prototype.mountRoutes = function (app) {
        // Other routes.
        // this.app.use('/api/v1/user', UserController.Instance.Router);
        // this.app.use('/api/v1/device-management', checkApiAuth, DeviceManagementController.Instance.Router);
        // this.app.use('/api/v1/alerts-management', checkApiAuth, AlertsManagementController.Instance.Router);
        // initialiseServices(app);
        var options = {
            target: this.targetUrl,
            changeOrigin: true,
            ws: true,
            secure: true, // if you want to verify the certificate
            // pathRewrite: {
            //   '^/api/old-path': '/api/new-path', // rewrite path
            //   '^/api/remove/path': '/path', // remove base path
            // },
            // router: {
            //   // when request.headers.host == 'dev.localhost:3000',
            //   // override target 'http://www.example.org' to 'http://localhost:8000'
            //   // 'dev.localhost:3000': 'http://localhost:8000',
            // },
            // router: {
            //     protocol: 'https:', // The : is required
            //     host: 'localhost',
            //     port: 8080
            // }
            //onProxyRes: responseInterceptor(async (responseBuffer, proxyRes: any, req, res: any) => {
            //   // const response = responseBuffer.toString('utf8'); // convert buffer to string
            //   try {
            //     // console.log('res = ', proxyRes.statusCode);
            //     if (res.statusCode === 401) {
            //       res.statusCode = 302;
            //       proxyRes.headers['location'] = 'https://uatgroundx.neom.com/login';
            //     }
            //     return responseBuffer;
            //   } catch (e) {
            //     console.error('error = ', e);
            //     return responseBuffer;
            //   }
            // })
        };
        // create the proxy (without context)
        // const exampleProxy = createProxyMiddleware(options);
        // this.app.use('/nuxeo/', createProxyMiddleware({
        //   target: this.targetUrl,
        //   // ws: true,
        //   secure: false,
        //   changeOrigin: true,
        //   // onProxyRes: responseInterceptor(async (responseBuffer, proxyRes: any, req, res: any) => {
        //   //   // const response = responseBuffer.toString('utf8'); // convert buffer to string
        //   //   try {
        //   //     // console.log('res = ', proxyRes.statusCode);
        //   //     if (res.statusCode === 401) {
        //   //       res.statusCode = 302;
        //   //       proxyRes.headers['location'] = 'https://uatgroundx.neom.com/login';
        //   //     }
        //   //     return responseBuffer;
        //   //   } catch (e) {
        //   //     console.error('error = ', e);
        //   //     return responseBuffer;
        //   //   }
        //   // })
        // }));
        this.app.use('/nuxeo/', (0, http_proxy_middleware_1.createProxyMiddleware)({
            //   router: {
            //     '/' : 'http://localhost:8001'
            // },
            // router: function () {
            //   return {
            //     protocol: 'https:', // The : is required
            //     host: 'tomcat-groundx.neom.com',
            //     port: 8087
            //   }
            // },
            target: this.targetUrl,
            changeOrigin: true,
            secure: false,
            logLevel: 'debug',
        }));
        // Default route.
        this.app.use(express.static(path.resolve(__dirname + '/../../' + '/dist')));
        this.app.get('*', function (req, res) {
            if (allowedExt.filter(function (ext) { return req.url.includes(ext); }).length > 0) {
                res.sendFile(path.resolve(__dirname + '/../../' + '/dist/' + req.url));
            }
            else {
                res.sendFile(path.resolve(__dirname + '/../../' + '/dist/index.html'));
            }
        });
        // function checkApiAuth(req: express.Request | any, res: express.Response, next: express.NextFunction) {
        //   const token: string = req.headers['access-token'];
        //   if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
        //   const secret = process.env.SECRET;
        //   jwt.verify(token, secret, function (err, decoded) {
        //     if (err) return res.status(402).send({ auth: false, message: 'Failed to authenticate token.' });
        //     next();
        //   });
        // }
    };
    return RouteManager;
}());
exports.RouteManager = RouteManager;

//# sourceMappingURL=build/routeManager.js.map
