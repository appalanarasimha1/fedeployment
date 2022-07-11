import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';

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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
  ) {}

  ngOnInit(): void {
  }

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  public togglePasswordVisibilityRenter(): void {
    this.showPasswordRenter = !this.showPasswordRenter;
  }

  formSubmit() {
    this.sendInvite = false;
    this.yourEmail = true;
  }
  submitCode() {
    this.sendInvite = false;
    this.yourEmail = false;
    this.enterCode = true;
  }
  verify() {
    this.sendInvite = false;
    this.yourEmail = false;
    this.enterCode = false;
    this.newPassword = true;
  }
  passwordSuccessfullyReset() {
    this.sendInvite = false;
    this.yourEmail = false;
    this.enterCode = false;
    this.newPassword = false;
    this.successfullyReset = true;
  }

}
