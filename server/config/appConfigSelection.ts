import {AppConfigDemo} from './appConfig.demo';
import {AppConfigProduction} from './appConfig.production';
import {AppConfigDevelopment} from './appConfig.development';
import {AppConfigUat} from './appConfig.uat';


export class AppConfig {

  private static env = process.env.NODE_ENV || 'development';

  public static get Config(): any {
    console.log('env ===== ',  process.env.NODE_ENV);
    switch (this.env) {
      case 'uat': {
        return AppConfigUat.Config;
      }
      case 'production': {
        return AppConfigProduction.Config;
      }
      case 'development': {
        return AppConfigDevelopment.Config;
      }
      case 'demo': {
        return AppConfigDemo.Config;
      }
      default:
        return AppConfigDevelopment.Config;
    }
  }
}

