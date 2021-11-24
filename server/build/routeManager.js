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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteManager = void 0;
var path = __importStar(require("path"));
var express = __importStar(require("express"));
var http_proxy_middleware_1 = require("http-proxy-middleware");
var body_parser_1 = __importDefault(require("body-parser"));
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
        this.targetUrl = process.env.API_SERVER;
        this.app = app;
        this.mountRoutes(app);
    }
    /**
     * Function to mount all the application routes under express application.
     */
    RouteManager.prototype.mountRoutes = function (app) {
        // const options = {
        //   target: this.targetUrl, // target host
        //   changeOrigin: true, // needed for virtual hosted sites
        //   ws: true, // proxy websockets
        //   secure: false, // if you want to verify the certificate
        //   onProxyRes: responseInterceptor(async (responseBuffer, proxyRes: any, req, res: any) => {
        //     // const response = responseBuffer.toString('utf8'); // convert buffer to string
        //     try {
        //       // console.log('res = ', proxyRes.statusCode);
        //       if (res.statusCode === 401) {
        //         res.statusCode = 302;
        //         proxyRes.headers['location'] = 'http://uatgroundx.neom.com/login';
        //       }
        //       return responseBuffer;
        //     } catch (e) {
        //       console.error('error = ', e);
        //       return responseBuffer;
        //     }
        //   })
        // };
        this.app.use('/nuxeo/', (0, http_proxy_middleware_1.createProxyMiddleware)({
            target: this.targetUrl,
            changeOrigin: true,
            secure: false,
            logLevel: 'debug',
        }));
        // parse application/x-www-form-urlencoded
        this.app.use(body_parser_1.default.urlencoded({ extended: false }));
        // parse application/json
        this.app.use(body_parser_1.default.json());
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
    };
    return RouteManager;
}());
exports.RouteManager = RouteManager;

//# sourceMappingURL=build/routeManager.js.map
