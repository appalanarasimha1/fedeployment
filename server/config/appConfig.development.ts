export class AppConfigDevelopment {
  private static config: any = {
    port: 4001,
    dbName: 'neom_poc',
    mongoDbUrl: 'mongodb://localhost:27017/',
      mongodbTables: {
        USER_TABLE: 'userDirectory',
        VIDEO_TABLE: 'personalizedVideoInventory'
      }
    //pythonApiUrl: 'http://localhost:5555'
  };

  public static get Config(): any {
    return this.config;
  }
}
