import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-browse-home',
  templateUrl: './browse-home.component.html',
  styleUrls: ['./browse-home.component.css']
})
export class BrowseHomeComponent implements OnInit {

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user'));
    const externalGlobalUsers: string[] = JSON.parse(localStorage.getItem('listExternalUserGlobal'));
    if(user.groups.indexOf("external_user") != -1 && externalGlobalUsers.indexOf(user.email) === -1) {
      this.router.navigate(['workspace', 'sharedFolder']);
    }
  }

}
