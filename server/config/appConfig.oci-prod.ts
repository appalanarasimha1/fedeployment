export class AppConfigProduction {
    private static userName: string = 'scy:ZAvPslOL';
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
      elasticDbUrl: 'http://10.101.21.63:9700',
      // elasticDbUrl: 'https://10.101.21.140:9200'
    };
  
    public static get Config(): any {
      return this.config;
    }
  }
  