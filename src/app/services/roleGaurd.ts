import { Injectable } from '@angular/core';
import { 
  Router,
  CanActivate,
  ActivatedRouteSnapshot
} from '@angular/router';

@Injectable()
export class RoleGuardService implements CanActivate {
  constructor(public router: Router) {}
  canActivate(route: ActivatedRouteSnapshot): boolean {
    // this will be passed from the route config
    // on the data property
    const expectedRole = route.data.expectedRole;
    const user = JSON.parse(localStorage.getItem('user'));

    if (user?.groups.indexOf(expectedRole) != -1) {
      return true;
    }
    this.router.navigate(['/']);
    return false;
  }
}