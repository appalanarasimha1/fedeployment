import {AppConfig} from "../config/appConfigSelection";

export class DbConfig {
  private static dbURL: string = AppConfig.Config.mongoDbUrl;
  private static dbName: string = AppConfig.Config.dbName;

  public static get DbUrl() {
    if (!process.env.NODE_ENV)
      return this.dbURL + this.dbName;

    return this.dbURL;
  }

  public static get DbName() {
    return this.dbName;
  }

}
