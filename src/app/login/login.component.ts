import { Component, OnInit } from '@angular/core';
import { NuxeoService } from '../services/nuxeo.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username: string;
  password: string;

  constructor(private nuxeo: NuxeoService) { }

  ngOnInit(): void {
  }

  login() {
    if((this.username && !this.username.trim()) || (this.password && !this.password.trim())) {
      return;
    }
    this.nuxeo.authenticateUser(this.username, this.password);
  }

  logout() {
    this.nuxeo.logout();
    return;
  }

}
