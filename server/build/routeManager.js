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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
        var _this = this;
        this.app.use('/nuxeo/', (0, http_proxy_middleware_1.createProxyMiddleware)({
            target: this.environment, changeOrigin: true, selfHandleResponse: true,
            onProxyRes: (0, http_proxy_middleware_1.responseInterceptor)(function (responseBuffer, proxyRes, req, res) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    // const response = responseBuffer.toString('utf8'); // convert buffer to string
                    try {
                        console.log('res = ', proxyRes.statusCode);
                        if (res.statusCode === 401) {
                            res.statusCode = 302;
                            proxyRes.headers.location = 'http://10.101.21.31:8080/login';
                        }
                        return [2 /*return*/, responseBuffer];
                    }
                    catch (e) {
                        console.error('error = ', e);
                        return [2 /*return*/, responseBuffer];
                    }
                    return [2 /*return*/];
                });
            }); })
        }));
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
