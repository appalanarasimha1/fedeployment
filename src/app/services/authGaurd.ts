import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { NuxeoService } from './nuxeo.service';
@Injectable()
export class AuthGuardService implements CanActivate {
  constructor(public nuxeoService: NuxeoService, public router: Router) {}
  canActivate(): boolean {
    if (!this.nuxeoService.isAuthenticated()) {
      this.router.navigate(['login']);
      return false;
    }
    return true;
  }
}