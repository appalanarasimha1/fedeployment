import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest,
  // HttpResponse
} from '@angular/common/http';

import { Observable } from 'rxjs';
// import { Router } from '@angular/router';
// import { tap } from 'rxjs/operators';
// import { SharedService } from './shared.service';
import { NuxeoService } from './nuxeo.service';
import { KeycloakService } from 'keycloak-angular';

/** Pass untouched request through to the next request handler. */
@Injectable()
export class InterceptorService implements HttpInterceptor {
  constructor(
    public nuxeo: NuxeoService,
    protected readonly keycloak: KeycloakService
    ) { }
  intercept(req: HttpRequest<any>, next: HttpHandler):
    Observable<HttpEvent<any>> {
      req = req.clone(
        {setHeaders: { 'X-Authentication-Token': localStorage.getItem('token') }
      });
      
        if(localStorage.getItem("logout-once-again")) {
          return next.handle(req);
        } else {
          localStorage.setItem("logout-once-again", "true");
          localStorage.removeItem("Administrator-default-nuxeo-recent-documents");
          this.nuxeo.logout();
          this.keycloak.logout(window.location.origin + '/login');
          return next.handle(req);
        }
  }
}