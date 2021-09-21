"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
var body_parser_1 = __importDefault(require("body-parser"));
var cors_1 = __importDefault(require("cors"));
var express_1 = __importDefault(require("express"));
var morgan_1 = __importDefault(require("morgan"));
var routeManager_1 = require("./routeManager");
var socket_io_1 = require("socket.io");
var App = /** @class */ (function () {
    function App() {
        this.app = (0, express_1.default)();
        // parse application/x-www-form-urlencoded
        this.app.use(body_parser_1.default.urlencoded({ extended: false }));
        // parse application/json
        this.app.use(body_parser_1.default.json());
        this.app.use((0, morgan_1.default)("dev"));
        this.app.use((0, cors_1.default)());
        var server = require('http').Server(this.app);
        this.app['io'] = new socket_io_1.Server(server, {
            cors: {
                origin: '*',
            }
        });
        var socketPort = 3010;
        server.listen(socketPort);
        this.app.io.on('connection', function (socket) {
            console.log('Client connected, socketID = ', socket.id);
        });
        // Define application routes.
        new routeManager_1.RouteManager(this.app);
    }
    Object.defineProperty(App.prototype, "App", {
        get: function () {
            return this.app;
        },
        enumerable: false,
        configurable: true
    });
    return App;
}());
exports.App = App;

//# sourceMappingURL=build/app.js.map
