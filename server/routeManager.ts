import * as path from 'path';
import * as express from 'express';

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
    // this.app.use('/api/v1/alerts-management', checkApiAuth, AlertsManagementController.Instance.Router);
    // initialiseServices(app);

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
