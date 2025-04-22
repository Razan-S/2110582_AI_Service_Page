import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Default redirect to home
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  
  // Home route (lazy loaded)
  { 
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Home - Gmail Integration'
  },
  
  // Login route (lazy loaded)
  { 
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
    title: 'Sign In - Gmail Integration'
  },
  
  // Protected email routes (lazy loaded)
  { 
    path: 'emails',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/emails/email-list/email-list.component')
          .then(m => m.EmailListComponent),
        title: 'Your Emails - Gmail Integration'
      },
      {
        path: ':id',
        loadComponent: () => import('./features/emails/email-detail/email-detail.component')
          .then(m => m.EmailDetailComponent),
        title: 'Email Details - Gmail Integration'
      }
    ]
  },
  
  // Wildcard route for 404 handling (redirect to home)
  { path: '**', redirectTo: 'home' }
];
