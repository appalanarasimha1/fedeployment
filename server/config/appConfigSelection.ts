import { AppConfigDemo } from './appConfig.demo';
import { AppConfigProduction } from './appConfig.production';
import { AppConfigDevelopment } from './appConfig.development';
import { AppConfigUat } from './appConfig.uat';
import { AppConfigLocal } from './appConfig.local';
import { AppConfigOCIProduction } from './appConfig.oci-prod';
import {AppConfigOCIUat } from './appConfig.oci-uat';
import { AppConfigOCIProductionNew } from './appConfig.oci-prod-new';


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
      case 'local': {
        return AppConfigLocal.Config;
      }
      case 'oci-prod': {
        return AppConfigOCIProduction.Config;
      }
      case 'oci-uat': {
        return AppConfigOCIUat.Config;
      }
      case 'oci-prod-new': {
        return AppConfigOCIProduction.Config;
      }
      default:
        return AppConfigDevelopment.Config;
    }
  }
}

