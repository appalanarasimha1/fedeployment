import { Request, Response, Router } from 'express';
import { DBService } from '../services/dbService';
import fs from 'fs';
import path from 'path';
// import { ResponseHandler } from '../common/ResponseHandler';

export class ReportController {
  private static instance: ReportController;
  private router: Router = Router();

  constructor() {
    this.router.get('/fetch-report', this.fetchReport);

  }

  /**
   * fetch user details from userDirectory - done
   * in assetSeen: [{sector: sectorname, videoIds: [{data: '_id of videos', count: number}]}] - done
   * if assetSeen - Done
   *    search in video_processing table {sector: assetSeen.sector, _id: {$nin: assetSeen.videoSeen}} - done
   *    if result found - Done
   *        send 1st object - Done
   *        update assetSeen with _id of video
   *    else
   *        find video of specified sector from video_processing table {sector: assetSeen.sector}, {limit: 1}
   *        return result
   * else send video matching the sector and set it in assetSeen - done
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