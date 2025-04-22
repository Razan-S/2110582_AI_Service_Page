export const environment = {
  production: true,
  google: {
    clientId: '{{YOUR_GOOGLE_CLIENT_ID}}', // Placeholder to be replaced with actual client ID
    scope: 'email profile https://www.googleapis.com/auth/gmail.readonly',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest']
  }
};

