import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import Nuxeo from 'nuxeo';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
// import { CookieService } from 'ngx-cookie-service';
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
  private baseUrl: string = environment.apiServiceBaseUrl;

  // Ici no définit le header d'appel de l'API
  private defaultHeader = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PUT,DELETE,POST,GET,OPTIONS',
    'enrichers.document': 'thumbnail,permissions,preview',
    Authorization: 'Bearer ' + localStorage.getItem('token'),
    properties: '*',
    'CSRF-Token': 'defaults'
  };

  // private instance = {request: function(){}};

  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(DOCUMENT) private document: Document,
    // private cookie: CookieService
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
    // const token = this.cookie.get('X-Authentication-Token');
    // const sessionId = this.cookie.get('JSESSIONID');
    if (this.nuxeoClient && localStorage.getItem('token')) {
      return true;
    } else {
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    this.nuxeoClient = null;
    this.http.get(`${this.baseUrl}/nuxeo/logout`)
      .subscribe((response: any) => {
      });
  }

  authenticateUser(username: string, password: string) {
    this.nuxeoClient = new Nuxeo({
      // baseURL: `${this.baseUrl}/nuxeo/`,
      baseURL: `${this.baseUrl}/nuxeo/`,
      auth: {
        username,
        password,
        method: 'basic'
      },
      headers: this.defaultHeader
    });

    return this.requestToken(null);
  }

  requestToken(token) {
    if (!this.nuxeoClient) {
      const options = {
        baseURL: `${environment.nuxeoServerUrl || this.baseUrl}/nuxeo/`,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'PUT,DELETE,POST,GET,OPTIONS',
        }
      }
      if (token) options.headers['Authorization'] = `Bearer ${token}`;
      this.nuxeoClient = new Nuxeo(options);
    }
    return this.nuxeoClient.requestAuthenticationToken('My App', '123', 'my-device', 'rw');
  }

  getRedirectLocation() {
    const redirectUri = window.location.origin + '/';
    const location = `${this.baseUrl}/nuxeo/oauth2/authorize?client_id=angular-client&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`
    return location;
  }

  createClientWithToken(token) {
    this.nuxeoClient = new Nuxeo({
      baseURL: `${this.baseUrl}/nuxeo/`,
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
