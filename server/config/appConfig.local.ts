export class AppConfigLocal {
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
      elasticDbUrl: 'http://localhost:9200',
      elasticSearchIndex: "searchindex_v4"
    };
  
    public static get Config(): any {
      return this.config;
    }
  }
  