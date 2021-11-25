export class AppConfigProduction {

 private static userName: string = 'CN=uat.core-dev.neos.today';
   //private static userName: string = 'CN=scry-in01.core-dev.neos.today';

  private static config: any = {
    port: 3001,
    socketPort: 3010,
    mongoDbUrl: `mongodb://${encodeURIComponent(this.userName)}@mongodb1.core-dev.neos.today:27017,mongodb2.core-dev.neos.today:27017`,
    dbName: 'neom_prod',
    mongodbTables: {
      USER_TABLE: 'userDirectory',
      VIDEO_TABLE: 'personalizedVideoInventory'
},
    domain: 'https://uat.core-dev.neos.today/'
  };


  public static get Config(): any {
    return this.config;
  }
}
