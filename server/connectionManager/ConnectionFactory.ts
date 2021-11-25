import {DbConnection} from "./DbConnection";
import {MongoDbConnectionManager} from "./MongoDbConnectionManager";

export class ConnectionFactory {

  public static getConnectionManager(): DbConnection {
    return MongoDbConnectionManager.Instance;
  }
}
