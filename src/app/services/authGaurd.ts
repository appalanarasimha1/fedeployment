import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from "@angular/router";
import { NuxeoService } from './nuxeo.service';
@Injectable()
export class AuthGuardService implements CanActivate {
  constructor(public nuxeoService: NuxeoService, public router: Router) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean {
    if (!this.nuxeoService.isAuthenticated()) {
      this.router.navigate(["login"], {
        queryParams: { redirectURL: state.url },
      });
      return false;
    }
    return true;
  }
}