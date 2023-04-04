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
    if(user.groups.includes("external_user") && !user.groups.includes("external_group_global")) {
      this.router.navigate(['workspace', 'sharedFolder']);
    }
  }

}
