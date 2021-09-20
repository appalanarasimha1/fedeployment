import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import Nuxeo from 'nuxeo';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CookieService } from 'ngx-cookie-service';
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
    Authorization: 'Bearer ' + localStorage.getItem('token'),
    properties: '*'
  };

  // private instance = {request: function(){}};

  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(DOCUMENT) private document: Document,
    private cookie: CookieService
  ) {
    const token = localStorage.getItem('token');
    if (!this.isAuthenticated()) {
      if(!token) {
        this.router.navigate(['login']);
        return;
      }
      this.createClientWithToken(token);
      return;
    }
    // this.authenticateUser(null, null);

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
    const token = this.cookie.get('X-Authentication-Token');
    const sessionId = this.cookie.get('JSESSIONID');
    if (this.nuxeoClient && localStorage.getItem('token')) {
      return true;
    } else {
      return false;
    }
  }

  logout(): void {
    this.http.get(`${this.document.location.origin}/nuxeo/logout`)
      .subscribe((response: any) => {
        // this.cookie.deleteAll();
        // this.nuxeoClient = null;
        // this.router.navigate(['login']);
      });

    this.cookie.deleteAll();
    localStorage.removeItem('token');
    // Document.cookie = "";
    this.nuxeoClient = null;
    this.router.navigate(['login']);
  }

  authenticateUser(username: string, password: string) {
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

    return this.nuxeoClient.requestAuthenticationToken('My App', '123', 'my-device', 'rw');
  }

  createClientWithToken(token) {
    this.nuxeoClient = new Nuxeo({
      baseURL: `${this.document.location.origin}/nuxeo/`,
      auth: {
        method: 'token',
        token
      },
      headers: this.defaultHeader
    });
    if(this.router.url === '/login') {
      this.router.navigate(['/']);
    }
    return;
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
