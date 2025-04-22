import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Define interfaces for our user data and authentication state
export interface User {
  email: string;
  name: string;
  imageUrl?: string;
  token: string;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // BehaviorSubject to maintain and share the user state
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  private gapiLoaded = false;
  private authInstance: gapi.auth2.GoogleAuth | null = null;

  constructor(private http: HttpClient) {
    // Check if we have user data in localStorage
    this.loadUserFromStorage();

    // Load GAPI on service initialization
    this.loadGapiClient();
  }

  /**
   * Loads the Google API client library and initializes the API client
   */
  private loadGapiClient(): void {
    // Only load once
    if (this.gapiLoaded) return;

    // Add gapi script to the document
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gapi.load('client:auth2', () => {
        gapi.client
          .init({
            clientId: environment.google.clientId,
            scope: environment.google.scope,
            discoveryDocs: environment.google.discoveryDocs,
          })
          .then(() => {
            this.authInstance = gapi.auth2.getAuthInstance();
            this.gapiLoaded = true;

            // Check if user is already signed in
            if (this.authInstance.isSignedIn.get()) {
              const googleUser = this.authInstance.currentUser.get();
              this.handleAuthSuccess(googleUser);
            }

            // Listen for sign-in state changes
            this.authInstance?.isSignedIn.listen((signedIn) => {
              if (signedIn) {
                const googleUser = this.authInstance?.currentUser.get();
                if (googleUser) {
                  this.handleAuthSuccess(googleUser);
                }
              } else {
                this.signOut();
              }
            });
          })
          .catch((error) => {
            console.error('Error initializing Google API client', error);
          });
      });
    };

    document.body.appendChild(script);
  }

  /**
   * Signs in the user with Google
   */
  public signIn(): Observable<User | null> {
    if (!this.gapiLoaded || !this.authInstance) {
      console.error('Google API client not loaded yet');
      return of(null);
    }

    return from(this.authInstance.signIn()).pipe(
      map((googleUser) => {
        return this.handleAuthSuccess(googleUser);
      }),
      catchError((error) => {
        console.error('Error during sign in:', error);
        return of(null);
      })
    );
  }

  /**
   * Signs out the user
   */
  public signOut(): Observable<boolean> {
    // Remove user from localStorage
    localStorage.removeItem('gmail_auth_user');

    // Update the BehaviorSubject
    this.currentUserSubject.next(null);

    // Sign out from Google if GAPI loaded
    if (this.gapiLoaded && this.authInstance) {
      return from(this.authInstance.signOut()).pipe(
        map(() => true),
        catchError((error) => {
          console.error('Error during sign out:', error);
          return of(false);
        })
      );
    }

    return of(true);
  }

  /**
   * Checks if the user is authenticated
   */
  public isAuthenticated(): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;

    // Check if token is expired
    return user.expiresAt > Date.now();
  }

  /**
   * Refreshes the authentication token
   */
  public refreshToken(): Observable<User | null> {
    if (!this.gapiLoaded || !this.authInstance) {
      console.error('Google API client not loaded yet');
      return of(null);
    }

    return from(this.authInstance.currentUser.get().reloadAuthResponse()).pipe(
      map((authResponse) => {
        const user = this.currentUserSubject.value;
        if (user) {
          const updatedUser: User = {
            ...user,
            token: authResponse.access_token,
            expiresAt: Date.now() + authResponse.expires_in * 1000,
          };

          // Update user in localStorage and BehaviorSubject
          localStorage.setItem('gmail_auth_user', JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);

          return updatedUser;
        }
        return null;
      }),
      catchError((error) => {
        console.error('Error refreshing token:', error);
        return of(null);
      })
    );
  }

  /**
   * Handles successful authentication and updates user state
   */
  private handleAuthSuccess(googleUser: gapi.auth2.GoogleUser): User {
    const profile = googleUser.getBasicProfile();
    const authResponse = googleUser.getAuthResponse(true);

    const user: User = {
      email: profile.getEmail(),
      name: profile.getName(),
      imageUrl: profile.getImageUrl(),
      token: authResponse.access_token,
      expiresAt: Date.now() + authResponse.expires_in * 1000,
    };

    // Store user in localStorage for persistence
    localStorage.setItem('gmail_auth_user', JSON.stringify(user));

    // Update the BehaviorSubject
    this.currentUserSubject.next(user);

    return user;
  }

  /**
   * Loads the user from localStorage if available
   */
  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem('gmail_auth_user');
    if (storedUser) {
      try {
        const user: User = JSON.parse(storedUser);

        // Check if token is expired
        if (user.expiresAt > Date.now()) {
          this.currentUserSubject.next(user);
        } else {
          // Token is expired, remove from storage
          localStorage.removeItem('gmail_auth_user');
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('gmail_auth_user');
      }
    }
  }

  /**
   * Gets the current authentication token
   */
  public getToken(): string | null {
    const user = this.currentUserSubject.value;
    return user ? user.token : null;
  }
}
