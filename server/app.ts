import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { RouteManager } from './routeManager';
import { Server } from 'socket.io';
import fs from 'fs';

export class App {
  private readonly app: any;

  constructor() {
    this.app = express();
    // parse application/x-www-form-urlencoded
    this.app.use(bodyParser.urlencoded({ extended: false }));
    // parse application/json
    this.app.use(bodyParser.json());
    this.app.use(morgan('dev'));
    this.app.use(cors());
    const httpsOptions = {
      key: fs.readFileSync(__dirname + '/../../../certs/new-ui.key'),
      cert: fs.readFileSync(__dirname + '/../../../certs/new-ui.crt')
    };
    const server = require('https').Server(httpsOptions, this.app);
    this.app['io'] = new Server(server, {
      cors: {
        origin: '*',
      }
    });
    const socketPort = process.env.SOCKET_PORT;
    server.listen(socketPort);

    this.app.io.on('connection', (socket: any) => {
      console.log('Client connected, socketID = ', socket.id);
    });

    // Define application routes.
    new RouteManager(this.app);
  }

  get App() {
    return this.app;
  }
}
