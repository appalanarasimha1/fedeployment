import { Request, Response, Router } from 'express';
import { ElasticSearchService } from '../services/elastic.service';
export class ElasticSearchController {
  private static instance: ElasticSearchController;
  private router: Router = Router();

  constructor() {
    this.router.get("/fetch", this.getMostSearchedTerm);
    this.router.post("/insert", this.insertSearchTerm);
    this.router.get("/searchCount", this.getTotalSearchCount);
    this.router.get("/getSearchCountByUser", this.getSearchCountByUser);
    this.router.get("/findUserBySearchCount", this.findUserBySearchCount);
    this.router.get("/findUserRecentTags", this.findUserRecentTags);
    this.router.post("/deleteUserRecentTags", this.deleteUserRecentTags);
    this.router.get("/fetchSectorByCount", this.fetchSectorByCount);
    
  }

  public async getMostSearchedTerm(req: Request, res: Response) {
    const service = new ElasticSearchService();
    const result: any = await service.findMostSearchedTerm();
    res.status(200).send({ data: result?.aggregations, message: "success" });
  }

  public async findUserBySearchCount(req: Request, res: Response) {
    const service = new ElasticSearchService();
    const result: any = await service.findUserBySearchCount();
    res.status(200).send({ data: result?.aggregations, message: "success" });
  }

  public async insertSearchTerm(req: Request, res: Response) {
    const service = new ElasticSearchService();
    // await service.insertData();
    const result: any = await service.insertData(
      req.query.term,
      req.query.username,
      req.query.sector
    );
    res.status(200).send({ data: result?.aggregations, message: "success" });
  }

  public async getTotalSearchCount(req: Request, res: Response) {
    const service = new ElasticSearchService();
    const result: any = await service.getTotalSearchCount();
    res.status(200).send({ data: result?.count, message: "success" });
  }

  public async getSearchCountByUser(req: Request, res: Response) {
    const service = new ElasticSearchService();
    const result: any = await service.getTotalSearchCount();
    res.status(200).send({ data: result?.count, message: "success" });
  }

  
  public async fetchSectorByCount(req: Request, res: Response) {
    const service = new ElasticSearchService();
    const result: any = await service.fetchSectorByCount();
    res.status(200).send({ data: result?.aggregations, message: "success" });
  }

  public async findUserRecentTags(req: Request, res: Response) {
    const service = new ElasticSearchService();
    // await service.insertData();
    const result: any = await service.getUserRecentTags(req.query.username);
    res.status(200).send({ data: result, message: "success" });
  }

  public async deleteUserRecentTags(req: Request, res: Response) {
    const service = new ElasticSearchService();
    // await service.insertData();
    const result: any = await service.deleteRecentTags(req.query.username);
    res.status(200).send({ data: result, message: "success" });
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
  //   public async getPersonalizedVideo(req: Request, res: Response) {
  //     try {
  //       const dbService: DBService = new DBService();
  //       const body: { username?: any, sector?: any } = req.query;
  //       const user: any = await dbService.findUser(body.username);

  //       if (user?.assetSeen?.length) {
  //         let index = user?.assetSeen.findIndex((item: any) => item.sector.toLowerCase() === body.sector.toLowerCase());
  //         if(index < 0) {
  //           await dbService.setAssetSeen(body.username, {sector: body.sector.toLowerCase(), personalizedVideoId: 'default'});
  //           res.send({ message: 'done', error: null, videoId: 'default', location: 'general' });
  //           return;
  //         }
  //         let video = await dbService.getMatchingVideo(body.sector.toLowerCase(), user.assetSeen[index].videoIds);
  //         if(video?.length) {
  //           await dbService.addInSeenVideo(body.username, body.sector.toLowerCase(), video[0]);
  //           res.send({message: 'done', error: null, videoId: video[0].personalizedVideoId});
  //           return;
  //         } else {
  //           const randomSeenVideo: number = Math.floor(Math.random() * (user.assetSeen[index].videoIds.length - 1));
  //           res.send({message: 'done', error: null, videoId: user.assetSeen[index].videoIds[randomSeenVideo]});
  //           return;
  //         }
  //         // if(video)
  //       } else {
  //         // assetSeen not present in user object
  //         //send random video of the matching sector
  //         let videoObj = await dbService.getMatchingVideo(body.sector.toLowerCase());
  //         if (videoObj?.length) {
  //           await dbService.setAssetSeen(body.username, videoObj[0]);
  //           res.send({ message: 'done', error: null, videoId: videoObj[0].personalizedVideoId });
  //           return;
  //         }
  //       }
  //       res.send({ message: 'done', error: null, videoId: 'default', location: 'general' });
  //       return;
  //     } catch (error: any) {
  //       res.status(500).send({ message: error.message });
  //       return;
  //     }
  //   }

  /**
   * Function to return /keywords router.
   * @constructor - Router.
   */
  public get Router(): Router {
    return this.router;
  }

  /**
   * Function to return instance of ElasticSearchController class.
   * @constructor - ElasticSearchController.
   */
  public static get Instance(): ElasticSearchController {
    if (!this.instance) {
      this.instance = new ElasticSearchController();
    }
    return this.instance;
  }
}