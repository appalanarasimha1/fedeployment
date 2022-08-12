import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {

  loading = false;
  emailValue: '';
  code: '';
  resetPassword: '';
  resetNewPassword: '';
  sendInvite: boolean = true;
  yourEmail: boolean = false;
  enterCode: boolean = false;
  newPassword: boolean = false;
  successfullyReset: boolean = false;
  public showPassword: boolean = false;
  public showPasswordRenter: boolean = false;
  private baseUrl: string = environment.apiServiceBaseUrl;
  errorMsg = "";

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(async (params) => {
      this.code = params.key;
      if (this.code) {
        this.verify();
      }
    })
  }

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  public togglePasswordVisibilityRenter(): void {
    this.showPasswordRenter = !this.showPasswordRenter;
  }

  formSubmit() {
    this.sendResetPasswordEmail();
  }
  submitCode() {
    this.errorMsg = "";
    this.sendInvite = false;
    this.yourEmail = false;
    this.enterCode = true;
  }
  verify() {
    this.errorMsg = "";
    this.sendInvite = false;
    this.yourEmail = false;
    this.enterCode = false;
    this.newPassword = true;
  }
  passwordSuccessfullyReset() {
    this.submitNewPassword();
  }

  sendResetPasswordEmail() {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    const urlencoded = new URLSearchParams();
    urlencoded.append("EmailAddress", this.emailValue);
    urlencoded.append("GroundXUrl", location.protocol + '//' + location.host);
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: myHeaders,
      body: urlencoded,
      redirect: 'follow'
    };

    fetch(`${this.baseUrl}/nuxeo/site/resetPassword/sendPasswordMail`, requestOptions)
      .then(async response => {
        if (response.status === 200) {
          this.errorMsg = "";
          this.sendInvite = false;
          this.yourEmail = true;
        } else {
          this.errorMsg = await response.text();
          console.log(this.errorMsg);
        }
      })
      .catch(error => {
        console.log('error', error);
        this.errorMsg = error;
      });
  }

  submitNewPassword() {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    const urlencoded = new URLSearchParams();
    urlencoded.append("PasswordKey", this.code);
    urlencoded.append("Password", this.resetPassword);
    urlencoded.append("PasswordConfirmation", this.resetNewPassword);
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: myHeaders,
      body: urlencoded,
      redirect: 'follow'
    };

    fetch(`${this.baseUrl}/nuxeo/site/resetPassword/submitNewPassword`, requestOptions)
      .then(async response => {
        if (response.status === 200) {
          this.errorMsg = "";
          this.sendInvite = false;
          this.yourEmail = false;
          this.enterCode = false;
          this.newPassword = false;
          this.successfullyReset = true;
        } else {
          this.errorMsg = await response.text();
          console.log(this.errorMsg);
        }
      })
      .catch(error => {
        console.log('error', error);
        this.errorMsg = error;
      });
  }

}
