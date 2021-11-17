import * as path from 'path';
import * as express from 'express';
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import bodyParser from 'body-parser';

const allowedExt = [
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

export class RouteManager {
  private readonly app: any;
  private targetUrl = process.env.API_SERVER;

  constructor(app: any) {
    this.app = app;
    this.mountRoutes(app);
  }

  /**
   * Function to mount all the application routes under express application.
   */
  private mountRoutes(app: any): void {

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

    this.app.use('/nuxeo/', createProxyMiddleware(
      {
        target: this.targetUrl,
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
      }
    ));
    // parse application/x-www-form-urlencoded
    this.app.use(bodyParser.urlencoded({ extended: false }));
    // parse application/json
    this.app.use(bodyParser.json());
    // Default route.
    this.app.use(express.static(path.resolve(__dirname + '/../../' + '/dist')));
    this.app.get('*', (req: express.Request, res: express.Response) => {
      if (allowedExt.filter(ext => req.url.includes(ext)).length > 0) {
        res.sendFile(path.resolve(__dirname + '/../../' + '/dist/' + req.url));
      } else {
        res.sendFile(path.resolve(__dirname + '/../../' + '/dist/index.html'));
      }
    });

  }
}
