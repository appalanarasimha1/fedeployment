import { Request, Response, Router } from 'express';
import { DBService } from '../services/dbService';

export class ReportController {
  private static instance: ReportController;
  private router: Router = Router();

  constructor() {
    this.router.get('/fetch-report', this.fetchReport);
  }

  /**
   * this API gets total user count.
   * download count user wise file count.
  */
  public async fetchReport(req: Request, res: Response) {
    try {
      const dbService: DBService = new DBService();
    //   const body: { username?: any, sector?: any } = req.query;
    //   const user: any = await dbService.findUser(body.username);
        const userCount = await dbService.findUserCount();
        const downloadAssetCount = await dbService.findDownloadCount();
        res.send({message: 'done', error: null, data: {userCount, downloadAssetCount}});
    } catch (error: any) {
      res.status(500).send({ message: error.message });
      return;
    }
  }

  /**
   * Function to return /keywords router.
   * @constructor - Router.
   */
  public get Router(): Router {
    return this.router;
  }

  /**
   * Function to return instance of ReportController class.
   * @constructor - ReportController.
   */
  public static get Instance(): ReportController {
    if (!this.instance) {
      this.instance = new ReportController();
    }
    return this.instance;
  }
}