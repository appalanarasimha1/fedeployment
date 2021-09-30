"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
var app_1 = require("./app");
var app = new app_1.App().App;
var port = process.env.PORT || 8080;
app.listen(port, function (err) {
    if (err) {
        return console.error(err);
    }
    return console.log('Application is running on port - ', port);
});
process.on('uncaughtException', function (err) {
    // Handle the error in the code, if this happens.
    console.error('Uncaught Exception occurred while execution, Root cause: ', err);
});

//# sourceMappingURL=index.js.map
