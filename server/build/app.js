"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
var cors_1 = __importDefault(require("cors"));
var express_1 = __importDefault(require("express"));
var morgan_1 = __importDefault(require("morgan"));
var routeManager_1 = require("./routeManager");
var fs_1 = __importDefault(require("fs"));
var https_1 = __importDefault(require("https"));
var App = /** @class */ (function () {
    function App() {
        this.app = (0, express_1.default)();
        // // parse application/x-www-form-urlencoded
        // this.app.use(bodyParser.urlencoded({ extended: false }));
        // // parse application/json
        // this.app.use(bodyParser.json());
        this.app.use((0, morgan_1.default)('dev'));
        this.app.use((0, cors_1.default)());
        var httpsOptions = {
            // key: fs_1.default.readFileSync(__dirname + '/../../../certs/new-ui.key'),
            // cert: fs_1.default.readFileSync(__dirname + '/../../../certs/new-ui.crt')
        };
        var server = https_1.default.createServer(httpsOptions, this.app);
        // this.app['io'] = new Server(server, {
        //   cors: {
        //     origin: '*',
        //   }
        // });
        // const socketPort = process.env.SOCKET_PORT;
        // server.listen(socketPort);
        // this.app.io.on('connection', (socket: any) => {
        //   console.log('Client connected, socketID = ', socket.id);
        // });
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
