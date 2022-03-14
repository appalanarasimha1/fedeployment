import { Injectable } from '@angular/core';
import { 
  Router,
  CanActivate,
  ActivatedRouteSnapshot
} from '@angular/router';
import { SharedService } from './shared.service';

@Injectable()
export class RoleGuardService implements CanActivate {
  constructor(private router: Router, private sharedService: SharedService) {}
  canActivate(route: ActivatedRouteSnapshot): boolean {
    // this will be passed from the route config
    // on the data property
    const expectedRole = route.data.expectedRole;

    if (this.sharedService.chekForReportRoles(expectedRole)) {
      return true;
    }
    this.router.navigate(['/']);
    return false;
  }
}