export class AppConfigDemo {
  private static userName: string = 'dev_user';
  private static password: any = process.env.mongoPassword;

  private static config: any = {
    port: 4001,
    socketPort: 4010,
    mongoDbUrl: `mongodb://${encodeURIComponent(this.userName)}:${encodeURIComponent(this.password)}@mongodb1.core-dev.neos.today:27017`,
    dbName: 'dev_groundx',
    mongodbTables: {
      USER_TABLE: 'userDirectory',
      VIDEO_TABLE: 'personalizedVideoInventory',
      AUDIT_TABLE: 'audit'
    },
    domain: 'https://uatgroundx.neom.com/',
    elasticDbUrl: 'http://10.101.21.63:9700',
    elasticSearchIndex: "searchindex_v4"
    // elasticDbUrl: 'http://localhost:9700'
  };

  public static get Config(): any {
    return this.config;
  }
}
