export class AppConfigOCIProduction {
    private static userName: string = 'scry';
    private static password: any = process.env.mongoPassword;
  
    private static config: any = {
      port: 4001,
      socketPort: 4010,
      mongoDbUrl: `mongodb://${encodeURIComponent(this.userName)}:${encodeURIComponent(this.password)}@10.149.49.34:27017/?authSource=admin`,
      dbName: 'prodgx',
      mongodbTables: {
        USER_TABLE: 'userDirectory',
        VIDEO_TABLE: 'personalizedVideoInventory',
        AUDIT_TABLE: 'audit'
      },
      domain: 'https://groundx.oci.sense.neomos.online/',
      elasticDbUrl: 'http://10.149.49.21:9200,10.149.49.22:9200,10.149.49.18:9200',
      // elasticDbUrl: 'https://10.101.21.140:9200'
    };
  
    public static get Config(): any {
      return this.config;
    }
  }
  