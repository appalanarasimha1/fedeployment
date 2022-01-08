import { ConnectionFactory } from '../connectionManager/ConnectionFactory';
import { DbConnection } from '../connectionManager/DbConnection';
import { ObjectId } from 'mongodb';
import * as _ from 'underscore';
import { AppConfig } from '../config/appConfigSelection';

export class DBService {
    private connectionManager: DbConnection = ConnectionFactory.getConnectionManager();

    public async findUser(username: string | undefined) {
        try {
            let connection: any = await this.connectionManager.getConnection();
            const query = {username};
            return await connection.collection(AppConfig.Config.mongodbTables.USER_TABLE).findOne(query);
        } catch (e) {
            console.error('find user: Exception occurred while execution - ', e);
            throw e;
        }
    }

    public async getMatchingVideo(sector: string | undefined, videoIds?: string[]) {
        try {
            let connection: any = await this.connectionManager.getConnection();
            const query = videoIds?.length ? {sector, 'personalizedVideoId': {'$nin': videoIds}} : {sector};
            return await connection.collection(AppConfig.Config.mongodbTables.VIDEO_TABLE).find(query).toArray();
        } catch (e) {
            console.error('getMatchingVideo: Exception occurred while execution - ', e);
            throw e;
        }
    }

    public async setAssetSeen(username: string | undefined, videoObj: any) {
        try {
            let connection: any = await this.connectionManager.getConnection();
            const findQuery = {username};
            const updateQuery = {'$push': {'assetSeen': {sector: videoObj.sector, videoIds: [videoObj.personalizedVideoId]}}};
            return await connection.collection(AppConfig.Config.mongodbTables.USER_TABLE).updateOne(findQuery, updateQuery);
        } catch (e) {
            console.error('setAssetSeen: Exception occurred while execution - ', e);
            throw e;
        }
    }

    public async addInSeenVideo(username: string | undefined, sector: string, videoObj: any) {
        try {
            let connection: any = await this.connectionManager.getConnection();
            const findQuery = {username, "assetSeen.sector": sector};
            const updateQuery = {$push:{"assetSeen.$.videoIds": videoObj.personalizedVideoId}};
            return await connection.collection(AppConfig.Config.mongodbTables.USER_TABLE).updateOne(findQuery, updateQuery);
        } catch (e) {
            console.error('setAssetSeen: Exception occurred while execution - ', e);
            throw e;
        }
    }
}
