import { Injectable } from '@angular/core';
import Nuxeo from 'nuxeo';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NuxeoService {

  // XXX Declared here to prevent from mixin style compilation error when using the service.
  login: any;
  operation: any;
  request: any;
  repository: any;
  batchUpload: any;
  users: any;
  groups: any;
  directory: any;
  workflows: any;
  requestAuthenticationToken: any;
  // ---

  nuxeoClient: any;
  private baseUrl: string = environment.baseUrl;

  // Ici no définit le header d'appel de l'API
  private defaultHeader = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PUT,DELETE,POST,GET,OPTIONS',
    'enrichers.document': 'thumbnail,preview',
    properties: '*'
  };

  // private instance = {request: function(){}};

  constructor() {
    this.nuxeoClient = new Nuxeo({
      // baseURL: `${this.baseUrl}/nuxeo/`,
      baseURL: `http://localhost:4200/nuxeo/`,
      auth: {
        username: 'Administrator',
        password: 'Z7DaUfED',
        method: 'basic'
      },
      headers: this.defaultHeader,
    });

    // Mixin Nuxeo JS Client prototype with NuxeoService to use it the same way.
    // Object.getOwnPropertyNames(Nuxeo.prototype).forEach(name => {
    //   if (/^_|constructor/.test(name)) {
    //     return;
    //   }

    //   try {
    //     NuxeoService.prototype[name] = function(...args: any[]) {
    //       return this.instance[name].apply(this.instance, args);
    //     };
    //   } catch (e) {
    //     console.error(e);
    //   }
    // });
  }

  public nuxeoClientConnect(): void {
    this.nuxeoClient.connect({
      // baseURL: `${this.baseUrl}/nuxeo/`,
      baseURL: `http://localhost:4200/nuxeo/`,
      auth: {
        username: 'Administrator',
        password: 'Z7DaUfED',
        method: 'basic'
      },
      headers: this.defaultHeader,
    })
      .then((client: any) => {
        if (client.connected) {
          console.log('Connection nuxeo OK! ', client.user, ' - VersionServer: ', client.serverVersion);
        }
      }).catch((err: any) => {
        console.log('Connection nuxeo KO!');
        throw err;
      });
  }
}
