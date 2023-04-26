export class AppConfigOCIProductionNew {
    private static userName: string = 'scy';
    private static password: any = process.env.mongoPassword;
  
    private static config: any = { 
      port: 4001,
      socketPort: 4010,
      mongoDbUrl: `mongodb://${encodeURIComponent(this.userName)}:${encodeURIComponent(this.password)}@10.149.49.34:27017,10.149.49.37:27017,10.149.49.38:27017/?authSource=admin&replicaSet=Test&readPreference=nearest&ssl=false`,
      dbName: 'cluster',
      mongodbTables: {
        USER_TABLE: 'userDirectory',
        VIDEO_TABLE: 'personalizedVideoInventory',
        AUDIT_TABLE: 'audit'
      },
      domain: 'https://groundx.neom.com/',
      elasticDbUrl: 'http://localhost:9200',
      elsticDbUserName: 'elastic',
      elasticCertificatePath: '/home/opc/rootCA.crt',
      elasticSearchIndex: "searchindex_v4",
      elasticPassword:process.env.ELASTIC_DB_PASSWORD
    };
  
    public static get Config(): any {
      return this.config;
    }
  }
  