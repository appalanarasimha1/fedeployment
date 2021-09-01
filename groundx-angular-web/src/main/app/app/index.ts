// App
export * from './app.component';
export * from './app.routes';

import { NuxeoService } from './services/nuxeo.service';

// Application wide providers
export const APP_PROVIDERS = [
  NuxeoService
];
