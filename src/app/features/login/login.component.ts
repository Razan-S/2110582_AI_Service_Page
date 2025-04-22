import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, ToastModule],
  providers: [MessageService],
})
export class LoginComponent implements OnInit {
  isLoading = false;
errorMessage: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.navigateToEmailList();
    }
  }

  onSignIn(): void {
    this.isLoading = true;

    this.authService.signIn().subscribe({
      next: (user) => {
        console.log('User:', user);
        this.isLoading = false;
        if (user) {
          this.navigateToEmailList();
        } else {
          this.showError('Failed to sign in. Please try again.');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Sign in error:', error);
        this.showError('An error occurred during sign in.');
      },
    });
  }

  private navigateToEmailList(): void {
    this.router.navigate(['/emails']);
  }

  private showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
    });
  }
}
