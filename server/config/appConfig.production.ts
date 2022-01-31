export class AppConfigProduction {
  private static userName: string = 'gxproduser';
  private static password: any = process.env.mongoPassword;

  private static config: any = {
    port: 4001,
    socketPort: 4010,
    mongoDbUrl: `mongodb://${encodeURIComponent(this.userName)}:${encodeURIComponent(this.password)}@mongodb1.core-dev.neos.today:27017`,
    dbName: 'prodgx',
    mongodbTables: {
      USER_TABLE: 'userDirectory',
      VIDEO_TABLE: 'personalizedVideoInventory'
    },
    domain: 'https://groundx.neom.com/',
    elasticDbUrl: '10.101.21.140:9200'
  };

  public static get Config(): any {
    return this.config;
  }
}
