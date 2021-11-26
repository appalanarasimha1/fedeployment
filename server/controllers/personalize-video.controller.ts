import { Request, Response, Router } from 'express';
import { DBService } from '../dbServices/dbService';
import fs from 'fs';
import path from 'path';
// import { ResponseHandler } from '../common/ResponseHandler';

export class PersonalizedVideoController {
  private static instance: PersonalizedVideoController;
  private router: Router = Router();

  constructor() {
    this.router.get('/', this.getPersonalizedVideo);
    this.router.get('/video', this.streamPersonalizedVideo);

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

  public async getPersonalizedVideo(req: Request, res: Response) {
    try {
      const dbService: DBService = new DBService();
      const body: { username?: any, sector?: any } = req.query;
      const user: any = await dbService.findUser(body.username);

      if (user?.assetSeen?.length) {
        let index = user?.assetSeen.findIndex((item: any) => item.sector.toLowerCase() === body.sector.toLowerCase());
        let video = await dbService.getMatchingVideo(body.sector.toLowerCase(), user.assetSeen[index].videoIds);
        // if(video)
      } else {
        // assetSeen not present in user object
        //send random video of the matching sector
        let videoObj = await dbService.getMatchingVideo(body.sector.toLowerCase());
        if (videoObj?.length) {
          const updateResponse = await dbService.setAssetSeen(body.username, videoObj[0]);
          res.send({ message: 'done', error: null, video: '' });
        }
      }
      res.send({ message: 'done' });
    } catch (error: any) {
      res.status(500).send({ message: error.message });
    }
  }

  streamPersonalizedVideo(req: Request, res: Response) {
    try {
      const path1 = path.join(__dirname + '/../../../../../personalizedVideo/default/energy/neomSample_1.mp4'); // TODO: video path and video name to be fetched from params
      const stat = fs.statSync(path1);
      const fileSize = stat.size;
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1]
          ? parseInt(parts[1], 10)
          : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(path1, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/avi', // TODO: make 'avi' dynamic, get it in params 
        }
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/avi', // TODO: make 'avi' dynamic, get it in params 
        }
        res.writeHead(200, head);
        fs.createReadStream(path1).pipe(res);
      }
    } catch (e) {
      console.log(e);
      res.send({message: e});
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
   * Function to return instance of PersonalizedVideoController class.
   * @constructor - PersonalizedVideoController.
   */
  public static get Instance(): PersonalizedVideoController {
    if (!this.instance) {
      this.instance = new PersonalizedVideoController();
    }
    return this.instance;
  }
}