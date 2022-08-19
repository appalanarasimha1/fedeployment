import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  loading = false;
  resetPassword: '';
  confirmNewPassword: '';
  newPassword: '';
  successfullyReset: boolean = false;
  public showPassword: boolean = false;
  public showPasswordRenter: boolean = false;
  registrationId: string;
  email: string;
  fullName: string;
  signUpError;
  private baseUrl: string = environment.apiServiceBaseUrl;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(async (params) => {
      this.registrationId = params.registrationId;
      this.email = params.email;
      if (this.email) {
        this.checkNeomEmail();
        this.checkEmail();
      }
    })
  }

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  public togglePasswordVisibilityRenter(): void {
    this.showPasswordRenter = !this.showPasswordRenter;
  }

  checkPassword() {
    return this.newPassword && this.confirmNewPassword && this.newPassword !== this.confirmNewPassword;
  }

  checkProcessSignUp() {
    return this.newPassword && this.confirmNewPassword && this.newPassword === this.confirmNewPassword && this.registrationId;
  }

  checkNeomEmail() {
    if (this.email.split('@')[1] === 'neom.com') this.router.navigate(['/login']);
  }

  checkEmail() {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    const urlencoded = new URLSearchParams();
    urlencoded.append("EmailAddress", this.email);
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: myHeaders,
      body: urlencoded,
      redirect: 'follow'
    };

    fetch(`${this.baseUrl}/nuxeo/site/resetPassword/checkEmail`, requestOptions)
      .then(response => {
        if (response.status === 200) this.router.navigate(['/login'])
      })
      .catch(error => {
        console.log('error', error);
      });
  }

  createAccount() {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    const urlencoded = new URLSearchParams();
    urlencoded.append("RequestId", this.registrationId);
    urlencoded.append("ConfigurationName", "default_registration");
    urlencoded.append("Password", this.newPassword);
    urlencoded.append("PasswordConfirmation", this.confirmNewPassword);
    urlencoded.append("submit", "Submit");
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: myHeaders,
      body: urlencoded,
      redirect: 'follow'
    };

    fetch(`${this.baseUrl}/nuxeo/site/userInvitation/validate`, requestOptions)
      .then(response => {
        if (response.status === 200) this.router.navigate(['/login'])
      })
      .catch(error => {
        console.log('error', error);
        this.signUpError = error;
      });
  }

}
