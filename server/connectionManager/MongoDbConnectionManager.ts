import { DbConfig } from './DbConfig';
import { DbConnection } from './DbConnection';
import * as mongodb from 'mongodb';

const fileName = process.env.NODE_ENV === 'demo' ? 'mongo-dev-uat.pem' : 'mongo-prod.pem';

export class MongoDbConnectionManager implements DbConnection {
  private dbConnectionCache: any;
  private mongoClient: any;
  private static instance: MongoDbConnectionManager;

  private constructor() {
    this.dbConnectionCache = {};
    this.mongoClient = mongodb.MongoClient;
  }

  public async getConnection(): Promise<any> {
    let dbObject = null;


    if (this.dbConnectionCache.dbUrl === DbConfig.DbUrl) {
      dbObject = this.dbConnectionCache.db;
    }

    if (dbObject) {
      return dbObject;
    } else {
      // console.log(DbConfig.DbUrl)
      // console.log(fileName)
      // console.log(__dirname);
      let client: mongodb.MongoClient;
      // if(!process.env.NODE_ENV) {
        client = await this.mongoClient.connect(DbConfig.DbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
      // } else {
      //   // Connect validating the returned certificates from the server
      //   client = new this.mongoClient(
      //     DbConfig.DbUrl,
      //     {
      //       useUnifiedTopology: true,
      //       tlsAllowInvalidHostnames: true,
      //       tlsCertificateKeyFile: `${__dirname}/ssl/${fileName}`
      //     }
      //   );
      // }

      const dbClient = await client.connect();

      const db = dbClient.db(DbConfig.DbName);
      this.dbConnectionCache = { dbUrl: DbConfig.DbUrl, db: db };
      console.log('Connection to mongodb successful !!!');
      return db;
    }
  }

  public static get Instance(): MongoDbConnectionManager {
    if (!this.instance) {
      this.instance = new MongoDbConnectionManager();
    }
    return this.instance;
  }
}
