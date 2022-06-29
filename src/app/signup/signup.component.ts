import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  loading = false;
  resetPassword: '';
  resetNewPassword: '';
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

}
