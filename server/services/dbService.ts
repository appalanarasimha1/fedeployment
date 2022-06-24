import { ConnectionFactory } from '../connectionManager/ConnectionFactory';
import { DbConnection } from '../connectionManager/DbConnection';
import { ObjectId } from 'mongodb';
import * as _ from 'underscore';
import { AppConfig } from '../config/appConfigSelection';
import { createDownloadQuery, createUploadQuery, createPreviewQuery, getSectorReport, createTopDownloadAndViewQuery } from '../dbquery';

export class DBService {
  private connectionManager: DbConnection =
    ConnectionFactory.getConnectionManager();

  public async findUser(username: string | undefined) {
    try {
      let connection: any = await this.connectionManager.getConnection();
      const query = { username };
      return await connection
        .collection(AppConfig.Config.mongodbTables.USER_TABLE)
        .findOne(query);
    } catch (e) {
      console.error("find user: Exception occurred while execution - ", e);
      throw e;
    }
  }

  public async getMatchingVideo(
    sector: string | undefined,
    videoIds?: string[]
  ) {
    try {
      let connection: any = await this.connectionManager.getConnection();
      const query = videoIds?.length
        ? { sector, personalizedVideoId: { $nin: videoIds } }
        : { sector };
      return await connection
        .collection(AppConfig.Config.mongodbTables.VIDEO_TABLE)
        .find(query)
        .toArray();
    } catch (e) {
      console.error(
        "getMatchingVideo: Exception occurred while execution - ",
        e
      );
      throw e;
    }
  }

  public async setAssetSeen(
    username: string | undefined,
    videoObj: { sector: string; personalizedVideoId: string }
  ) {
    try {
      let connection: any = await this.connectionManager.getConnection();
      const findQuery = { username };
      const updateQuery = {
        $push: {
          assetSeen: {
            sector: videoObj.sector,
            videoIds: [videoObj.personalizedVideoId],
          },
        },
      };
      return await connection
        .collection(AppConfig.Config.mongodbTables.USER_TABLE)
        .updateOne(findQuery, updateQuery);
    } catch (e) {
      console.error("setAssetSeen: Exception occurred while execution - ", e);
      throw e;
    }
  }

  public async addInSeenVideo(
    username: string | undefined,
    sector: string,
    videoObj: any
  ) {
    try {
      let connection: any = await this.connectionManager.getConnection();
      const findQuery = { username, "assetSeen.sector": sector };
      const updateQuery = {
        $push: { "assetSeen.$.videoIds": videoObj.personalizedVideoId },
      };
      return await connection
        .collection(AppConfig.Config.mongodbTables.USER_TABLE)
        .updateOne(findQuery, updateQuery);
    } catch (e) {
      console.error("setAssetSeen: Exception occurred while execution - ", e);
      throw e;
    }
  }

  public async findUserCount() {
    try {
      let connection: any = await this.connectionManager.getConnection();
      const query = { email: { $exists: true } };
      return await connection
        .collection(AppConfig.Config.mongodbTables.USER_TABLE)
        .count(query);
    } catch (e) {
      console.error("find usercount: Exception occurred while execution - ", e);
      throw e;
    }
  }

  public async findDownloadCount() {
    try {
      let connection: any = await this.connectionManager.getConnection();
      const query = createDownloadQuery();
      return await connection
        .collection(AppConfig.Config.mongodbTables.AUDIT_TABLE)
        .aggregate(query)
        .toArray();
    } catch (e) {
      console.error(
        "find download asset count: Exception occurred while execution - ",
        e
      );
      throw e;
    }
  }

  public async getTopDownloadAndView() {
    try {
      let connection: any = await this.connectionManager.getConnection();
      const query = createTopDownloadAndViewQuery();
      return await connection
        .collection(AppConfig.Config.mongodbTables.AUDIT_TABLE)
        .aggregate(query)
        .toArray();
    } catch (e) {
      console.error(
        "getTopDownloadAndView: Exception occurred while execution - ",
        e
      );
      throw e;
    }
  }

  public async findPreviewCount() {
    try {
      let connection: any = await this.connectionManager.getConnection();
      const query = createPreviewQuery();
      return await connection
        .collection(AppConfig.Config.mongodbTables.AUDIT_TABLE)
        .aggregate(query)
        .toArray();
    } catch (e) {
      console.error(
        "find preview asset count: Exception occurred while execution - ",
        e
      );
      throw e;
    }
  }

  public async findUploadCount() {
    try {
      let connection: any = await this.connectionManager.getConnection();
      const query = createUploadQuery();
      return await connection
        .collection(AppConfig.Config.mongodbTables.AUDIT_TABLE)
        .aggregate(query)
        .toArray();
    } catch (e) {
      console.error(
        "find upload asset count: Exception occurred while execution - ",
        e
      );
      throw e;
    }
  }


  public async findSectorReport() {
    try {
      let connection: any = await this.connectionManager.getConnection();
      const query = getSectorReport();
      return await connection
        .collection("default")
        .aggregate(query)
        .toArray();
    } catch (e) {
      console.error(
        "find upload asset count: Exception occurred while execution - ",
        e
      );
      throw e;
    }
  }
}
