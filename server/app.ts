import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { RouteManager } from './routeManager';
import { Server } from 'socket.io';
import fs from 'fs';
import https from 'https';
import compression from 'compression';


export class App {
  private readonly app: any;

  constructor() {
    this.app = express();
    // // parse application/x-www-form-urlencoded
    // this.app.use(bodyParser.urlencoded({ extended: false }));
    // // parse application/json
    // this.app.use(bodyParser.json());
    this.app.use(morgan('dev'));
    this.app.use(cors());
    this.app.use(compression());
    
    const httpsOptions = {
      // key: fs.readFileSync(__dirname + '/../../../certs/new-ui.key'),
      // cert: fs.readFileSync(__dirname + '/../../../certs/new-ui.crt')
    };
    const server = https.createServer(httpsOptions, this.app);

    // Define application routes.
    new RouteManager(this.app);
  }

  get App() {
    return this.app;
  }
}
