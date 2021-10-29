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
  private targetUrl: string;
  // = process.env.NODE_ENV === 'production' ? 'https://10.101.21.63:8087' : 'https://10.101.21.31:8090';

  constructor(app: any) {
    this.app = app;
    
    switch (process.env.NODE_ENV) {
      case 'dev':
        this.targetUrl = 'http://34.219.179.33:8080';
        // this.port = 8080;
        // this.protocol = '';
        break;
      case 'demo':
        this.targetUrl = 'https://10.101.21.31:8090';
        // this.port = 8080;
        // this.protocol = 'https:';
        break;
      case 'production':
        this.targetUrl = 'https://10.101.21.63:8087';
        // this.port = 8087;
        // this.protocol = 'https:';
        break;
      default:
        this.targetUrl = 'http://34.219.179.33:8087';
        // this.port = 8080;
        // this.protocol = 'http:';
        break;
    }
    this.mountRoutes(app);
  }

  /**
   * Function to mount all the application routes under express application.
   */
  private mountRoutes(app: any): void {
    // Other routes.
    // this.app.use('/api/v1/user', UserController.Instance.Router);
    // this.app.use('/api/v1/device-management', checkApiAuth, DeviceManagementController.Instance.Router);
    // this.app.use('/api/v1/alerts-management', checkApiAuth, AlertsManagementController.Instance.Router);
    // initialiseServices(app);

    const options = {
      target: this.targetUrl, // target host
      changeOrigin: true, // needed for virtual hosted sites
      ws: true, // proxy websockets
      secure: false, // if you want to verify the certificate

      // onProxyRes: responseInterceptor(async (responseBuffer, proxyRes: any, req, res: any) => {
      //   // const response = responseBuffer.toString('utf8'); // convert buffer to string
      //   try {
      //     // console.log('res = ', proxyRes.statusCode);
      //     if (res.statusCode === 401) {
      //       res.statusCode = 302;
      //       proxyRes.headers['location'] = 'http://uatgroundx.neom.com/login';
      //     }
      //     return responseBuffer;
      //   } catch (e) {
      //     console.error('error = ', e);
      //     return responseBuffer;
      //   }
      // })
    };

    this.app.use('/nuxeo/', createProxyMiddleware(
      {
        target: this.targetUrl,
        changeOrigin: true,
        // secure: false,
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

    // function checkApiAuth(req: express.Request | any, res: express.Response, next: express.NextFunction) {
    //   const token: string = req.headers['access-token'];
    //   if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

    //   const secret = process.env.SECRET;
    //   jwt.verify(token, secret, function (err, decoded) {
    //     if (err) return res.status(402).send({ auth: false, message: 'Failed to authenticate token.' });

    //     next();
    //   });
    // }

  }
}
