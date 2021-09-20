import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NuxeoService } from '../services/nuxeo.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  error = false;
  errorMessage = '';

  constructor(private nuxeo: NuxeoService, private router: Router) { }

  ngOnInit(): void {
    if (this.nuxeo.nuxeoClient) {
      this.router.navigate(['/']);
      return;
    }
  }

  login() {
    if ((this.username && this.username.trim()) && (this.password)) {
      this.nuxeo.authenticateUser(this.username, this.password)
        .then((token) => {
          this.nuxeo.createClientWithToken(token);
          localStorage.setItem('token', token);
          this.router.navigate(['/']);
        })
        .catch((err) => {
          this.error = true;
          this.errorMessage = 'Authentication failed, please check username/password and retry';
          throw err;
        });
    }
    if (!this.username.trim()) {
      this.error = true;
      this.errorMessage = 'Username can not be blank';
      return;
    }

    if (!this.password) {
      this.error = true;
      this.errorMessage = 'Password can not be blank';
      return;
    }
    return;
  }

  logout() {
    this.nuxeo.logout();
    return;
  }

}
