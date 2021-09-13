import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import Nuxeo from 'nuxeo';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable()
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
    'enrichers.document': 'thumbnail,permissions,preview',
    properties: '*'
  };

  // private instance = {request: function(){}};

  constructor(private router: Router, private http: HttpClient, @Inject(DOCUMENT) private document: Document) {
    this.authenticateUser(null, null);

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

  isAuthenticated(): boolean {
    if (this.nuxeoClient) {
      return true;
    } else {
      return false;
    }
  }

  logout(): void {
    this.http.get(`${this.document.location.origin}/nuxeo/logou`, { headers: this.defaultHeader })
    .subscribe((response: any) => {
      this.router.navigate(['/login']);
      this.nuxeoClient = null;
    });
  }

  authenticateUser(username: string, password: string) {
    console.log('base url = ', this.document.location.origin);
    this.nuxeoClient = new Nuxeo({
      // baseURL: `${this.baseUrl}/nuxeo/`,
      baseURL: `${this.document.location.origin}/nuxeo/`,
      auth: {
        username,
        password,
        method: 'basic'
      },
      headers: this.defaultHeader
    });

    this.nuxeoClient.requestAuthenticationToken('My App', '123', 'my-device', 'rw')
      .then((token) => {
        this.nuxeoClient = new Nuxeo({
          baseURL: `${this.document.location.origin}/nuxeo/`,
          auth: {
            method: 'token',
            token
          },
          headers: this.defaultHeader
        });
        this.router.navigate(['/']);
        // do something with the new `nuxeo` client using token authentication
        // store the token, and next time you need to create a client, use it
      })
      .catch((err) => {
        this.router.navigate(['/login']);
        throw err;
      });
  }

  // public nuxeoClientConnect(auth: any): void {
  //   this.nuxeoClient.connect({
  //     // baseURL: `${this.baseUrl}/nuxeo/`,
  //     baseURL: `http://localhost:4200/nuxeo/`,
  //     auth,
  //     headers: this.defaultHeader,
  //   })
  //     .then((client: any) => {
  //       if (client.connected) {
  //         console.log('Connection nuxeo OK! ', client.user, ' - VersionServer: ', client.serverVersion);
  //       }
  //     }).catch((err: any) => {
  //       this.router.navigate(['/login']);
  //       console.log('Connection nuxeo KO!');
  //       throw err;
  //     });
  // }
}
