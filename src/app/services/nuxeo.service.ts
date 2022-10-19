import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import Nuxeo from 'nuxeo';
import { HttpClient } from '@angular/common/http';
import { SharedService } from '../services/shared.service'
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
    private sharedService: SharedService,
    @Inject(DOCUMENT) private document: Document,
    // private cookie: CookieService
  ) {
    const token = localStorage.getItem('token');
    if (!this.isAuthenticated()) {
      // if(!token) {
      //   this.router.navigate(['login']);
      //   return;
      // }
      if (token) {
        this.createClientWithToken(token);
        return;
      }
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

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.nuxeoClient = null;
    const response = await this.http.get(`${this.baseUrl}/nuxeo/logout`);
    return;
  }

  async authenticateUser(username: string, password: string) {
    let encryptedPassword = password;
    const key = await (await this.getPrivateKey()).text();

    if (key) {
      encryptedPassword = this.sharedService.encryptText(password, key);
    }

    const res = await this.checkUserLockout(username, encryptedPassword);
    if (res.status === 200) {
      const statusText = await res.text();
      if (statusText && statusText !== 'OK') throw statusText;
    }


    this.nuxeoClient = new Nuxeo({
      // baseURL: `${this.baseUrl}/nuxeo/`,
      baseURL: `${this.baseUrl}/nuxeo/`,
      auth: {
        username,
        password: encryptedPassword,
        method: 'basic'
      },
      headers: this.defaultHeader
    });

    return this.requestToken(null, btoa(`${username}:${encryptedPassword}`));
  }

  getPrivateKey() {
    return fetch(`${this.baseUrl}/nuxeo/site/authCheck/key`);
  }

  checkUserLockout(username: string, password: string) {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    const urlencoded = new URLSearchParams();
    urlencoded.append("username", username);
    urlencoded.append("password", password);
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: myHeaders,
      body: urlencoded,
      redirect: 'follow'
    };

    return fetch(`${this.baseUrl}/nuxeo/site/authCheck/check`, requestOptions);
  }

  requestToken(token, basicToken?: string) {
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
    this.initNxfileRequest(token, basicToken);
    return this.nuxeoClient.requestAuthenticationToken('My App', '123', 'my-device', 'rw');
  }

  initNxfileRequest(token, basicToken?: string) {
    if (!token && !basicToken) return;
    const options = {};
    if (token) {
      options["headers"] = {
        "Authorization": `Bearer ${token}`
      }
    } else {
      options["headers"] = {
        "Authorization": `Basic ${basicToken}`
      }
    }
    fetch(`${this.baseUrl}/nuxeo/nxfile/default`, options);
    fetch(`/nuxeo/nxfile/default`, options);
  }

  getRedirectLocation() {
    const redirectUri = window.location.origin + '/';
    const location = `${this.baseUrl}/nuxeo/oauth2/authorize?client_id=angular-client&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`
    return location;
  }

  createClientWithToken(token, redirect = true) {
    this.nuxeoClient = new Nuxeo({
      baseURL: `${this.baseUrl}/nuxeo/`,
      auth: {
        method: 'token',
        token
      },
      headers: this.defaultHeader
    });
    if(this.router.url === '/login' && redirect) {
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
