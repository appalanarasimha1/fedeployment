export class AppConfigOCIUat {
    private static userName: string = 'scry';
    private static password: any = process.env.mongoPassword;
  
    private static config: any = {
      port: 4001,
      socketPort: 4010,
      mongoDbUrl: `mongodb://${encodeURIComponent(this.userName)}:${encodeURIComponent(this.password)}@mongodb-1.groundxuat.com:27017,mongodb-2.groundxuat.com:27017,mongodb-3.groundxuat.com:27017/?authSource=admin&replicaSet=rs-2&readPreference=nearest&ssl=false`,
      dbName: 'uat_cluster',
      mongodbTables: {
        USER_TABLE: 'userDirectory',
        VIDEO_TABLE: 'personalizedVideoInventory',
        AUDIT_TABLE: 'audit'
      },
      domain: 'https://uatgroundx.oci.sense.neomos.online/',
      elasticDbUrl: 'http://localhost:9200', // 'http://10.149.49.21:9200,10.149.49.22:9200,10.149.49.18:9200',
      elsticDbUserName: 'elastic',
      elasticCertificatePath: '/home/opc/rootCA.crt',
      elasticSearchIndex: "searchindex_v5"
      // elasticDbUrl: 'https://10.101.21.140:9200'
    };
  
    public static get Config(): any {
      return this.config;
    }
  }
  