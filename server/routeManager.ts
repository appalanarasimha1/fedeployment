import * as path from 'path';
import * as express from 'express';
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import { ConnectionFactory } from './connectionManager/ConnectionFactory';
import { DbConnection } from './connectionManager/DbConnection';
import bodyParser from 'body-parser';
import { PersonalizedVideoController } from './controllers/personalize-video.controller';
import { ElasticSearchController } from './controllers/elastic-search.controller';
import { ReportController } from './controllers/report.controller';
import { GisController } from './controllers/gis-map.controller';

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
    // Other routes.
    // this.app.use('/api/v1/user', UserController.Instance.Router);
    // this.app.use('/api/v1/device-management', checkApiAuth, DeviceManagementController.Instance.Router);
    this.app.use('/nuxeo/api/v1/fetchPersonalizedVideo', PersonalizedVideoController.Instance.Router);
    this.app.use('/nuxeo/api/v1/searchTerm', ElasticSearchController.Instance.Router);
    this.app.use('/nuxeo/api/v1/report', ReportController.Instance.Router);
    this.app.use('/nuxeo/api/v1/gis', GisController.Instance.Router);
    initialiseServices(app);
    
    // this.app.use('/nuxeo/api/v1/fetchPersonalizedVideo', (req: any, res: any) => {
    //   console.log('fetchPersonalizedVideo');
    //   /**
    //    * fetch user details from userDirectory
    //    * in assetSeen: {sector: sectorname, videoSeen: ['_id of videos']}
    //    * search in video_processing table {sector: assetSeen.sector, _id: {$nin: assetSeen.videoSeen}}
    //    * if result found
    //    *    send 1st object
    //    *    update assetSeen with _id of video
    //    * else
    //    *    find video of specified sector from video_processing table  {sector: assetSeen.sector}, {limit: 1}
    //    *    return result
    //    */
    //   res.send({message: 'done', status: 200});
    //   return;
    // });

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
      proxyTimeout: 1200000
    };

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
      if (allowedExt.filter(ext => {
        const arr = req.url.split(ext);
        if(arr.length === 2 && arr[1] === '' ) return true;
        else return false;
      }).length > 0) {
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

    
    async function initialiseServices(app: any) {
      // innitialising mongo connection
      let connectionManager: DbConnection = ConnectionFactory.getConnectionManager();
      const connection = await connectionManager.getConnection();
      return;
    }

  }
}
