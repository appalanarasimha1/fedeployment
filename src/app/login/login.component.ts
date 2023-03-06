import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';
import { NuxeoService } from '../services/nuxeo.service';
import { KeycloakService } from 'keycloak-angular';

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
  keycloakLoading = false;
  redirectURL: string;
  externalPartnerShow: boolean = false;
  contactNeom: boolean = false;

  constructor(
    private nuxeo: NuxeoService,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    protected readonly keycloak: KeycloakService
  ) {}

  ngOnInit(): void {
    this.redirectURL = this.route.snapshot.queryParams['redirectURL'] || '/';
    if (this.nuxeo.nuxeoClient && localStorage.getItem('token')) {
      this.router.navigateByUrl(this.redirectURL);
      return;
    }
    this.checkLoginState();
  }

  async checkLoginState() {
    this.keycloakLoading = true;
    try {
      const keycloakToken = await this.keycloak.getToken();

      if (!keycloakToken) {
        this.keycloakLoading = false;
        return;
      }
      let token = await this.nuxeo.requestToken(keycloakToken);

      if (token && !token.toLowerCase().includes('doctype')) {
        localStorage.setItem('token', token);
        await this.nuxeo.createClientWithToken(token);
        this.keycloakLoading = false;
        this.router.navigateByUrl(this.redirectURL);
      }
    } catch (e) {
      console.error(e);
    }
    this.keycloakLoading = false;
  }

  loginKeycloak() {
    this.keycloak.login({
      redirectUri: window.location.href,
    });
  }

  login() {
    if ((this.username && this.username.trim()) && (this.password)) {
      this.loading = true;
      this.nuxeo.authenticateUser(this.username, this.password)
        .then(async (token) => {
          try {
            fetch(`/nuxeo/authentication/token?applicationName=My%20App&deviceId=123&deviceDescription=my-device&permission=rw`, {
              headers: { "X-Authentication-Token": token },
            });
          } catch (err) {
            
            console.log(err);
          }

          // this.nuxeo.createClientWithToken(token);
          if (!token || token.toLowerCase().includes('doctype')) {
            this.error = true;
            this.errorMessage = 'Incorrect credentials!';
            this.loading = false;
            return;
          }
          localStorage.setItem('token', token);
          localStorage.setItem('username', this.username);
          await this.nuxeo.createClientWithToken(token, false);
          this.loading = false;
          this.router.navigateByUrl(this.redirectURL);
        })
        .catch((err) => {
          this.loading = false;
          this.error = true;
          if (err === "ip_lockout") {
            this.errorMessage = 'IP lockout';
          } else if (err?.split(':')[0] === "username_lockout") {
            this.errorMessage = 'User lockout';
          } else this.errorMessage = 'Incorrect credentials!';
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
    this.keycloak.logout(window.location.origin + '/login');
  }

  externalPartner() {
    this.externalPartnerShow = !this.externalPartnerShow;
  }
  contactNeomPage() {
    // this.externalPartnerShow = !this.externalPartnerShow;
    this.contactNeom = !this.contactNeom
  }
}
