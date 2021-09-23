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
        this.environment = process.env.NODE_ENV === 'demo' ? 'http://10.101.21.58:8089' : 'http://10.101.21.63:8087';
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
        this.app.use('/nuxeo/', (0, http_proxy_middleware_1.createProxyMiddleware)({ target: this.environment, changeOrigin: true }));
        this.app.use('/sockjs-node/', (0, http_proxy_middleware_1.createProxyMiddleware)({ target: this.environment, changeOrigin: true }));
        function proxyMiddleware() {
        }
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
