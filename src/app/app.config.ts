import { ApplicationConfig } from '@angular/core';
import {
  provideRouter,
  PreloadAllModules,
  withPreloading,
} from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideClientHydration(),
    provideHttpClient(withFetch()),
    provideAnimations(),
    providePrimeNG({
      ripple: true,
      // Check the correct way to set theme in your PrimeNG version
      // This might vary depending on the version you're using
      // theme: 'aura-light', // or use the correct configuration format
    }),
  ],
};
