# Gmail OAuth Integration Angular Project

This project implements secure OAuth authentication with Gmail API to view and read email messages.

## Features

- Secure OAuth 2.0 authentication with Google
- View Gmail messages in a responsive UI
- Read detailed email content
- Automatic token refresh and management
- Protected routes with authentication guards

## Setup Instructions

### Prerequisites

- Node.js and npm installed
- Angular CLI installed (`npm install -g @angular/cli`)

### Google Cloud Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API for your project
4. Create OAuth 2.0 credentials
   - Set the authorized JavaScript origins to `http://localhost:4200`
   - Set the authorized redirect URIs to `http://localhost:4200`
5. Configure the OAuth consent screen

### Project Configuration

1. Clone the repository
2. Install dependencies with `npm install`
3. Update the environment files with your Google Client ID:
   - Open `src/environments/environment.ts`
   - Replace `{{YOUR_GOOGLE_CLIENT_ID}}` with your actual Google Client ID
4. Start the development server with `ng serve`
5. Navigate to `http://localhost:4200`

## Application Structure

- **src/app/services**
  - `auth.service.ts` - Handles OAuth authentication
  - `email.service.ts` - Manages Gmail API interactions

- **src/app/features**
  - `/home` - Home page
  - `/login` - Google Authentication
  - `/emails/email-list` - List of emails
  - `/emails/email-detail` - Individual email content

- **src/app/guards**
  - `auth.guard.ts` - Protects routes that require authentication

## Development Guidelines

- Run tests with `ng test`
- Create new components with `ng generate component component-name`
- Build for production with `ng build --prod`

## License

This project is licensed under the MIT License.

# 2110582AISERVICE

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
