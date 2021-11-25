import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
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
  loading = false;

  constructor(private nuxeo: NuxeoService, private router: Router, private apiService: ApiService) { }

  ngOnInit(): void {
    if (this.nuxeo.nuxeoClient && localStorage.getItem('token')) {
      this.router.navigate(['/']);
      return;
    }
  }

  // login() {
  //   const url = 'http://10.101.21.31:8080/nuxeo/startup'; //https://tomcat-groundx.neom.com:8087
  //   const headers = {};
  //   const body = {
  //     user_name: 'Administrator',
  //     user_password: 'Z7DaUfED',
  //     language: 'en',
  //     requestedUrl: '/'
  //   };
  //   this.apiService.post(url, body).subscribe(data => {
  //     console.log(data);
  //   });
  // }

  login() {
    if ((this.username && this.username.trim()) && (this.password)) {
      this.loading = true;
      this.nuxeo.authenticateUser(this.username, this.password)
        .then((token) => {
          // this.nuxeo.createClientWithToken(token);
          this.loading = false;
          if (token.toLowerCase().includes('doctype')) {
            this.error = true;
            this.errorMessage = 'Authentication failed, please check username/password and retry';
            return;
          }
          localStorage.setItem('token', token);
          localStorage.setItem('username', this.username);
          this.router.navigate(['/']);
        })
        .catch((err) => {
          this.loading = false;
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
