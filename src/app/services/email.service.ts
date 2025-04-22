import { Injectable } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface EmailHeader {
  name: string;
  value: string;
}

export interface EmailListItem {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId?: string;
  internalDate?: string;
  payload?: {
    headers: EmailHeader[];
    mimeType: string;
    subject?: string;
    from?: string;
    to?: string;
    date?: string;
  };
}

export interface EmailContent {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload: {
    partId?: string;
    mimeType: string;
    filename?: string;
    headers: EmailHeader[];
    body?: {
      size: number;
      data?: string;
    };
    parts?: Array<{
      partId: string;
      mimeType: string;
      filename?: string;
      headers: EmailHeader[];
      body: {
        size: number;
        data?: string;
      };
    }>;
  };
}

export interface EmailListResponse {
  messages: Array<{
    id: string;
    threadId: string;
  }>;
  nextPageToken?: string;
  resultSizeEstimate: number;
}

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  private readonly API_BATCH_SIZE = 20;

  constructor(private authService: AuthService) {}

  /**
   * Loads the Gmail API if not already loaded
   */
  private loadGmailApi(): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      if (
        typeof gapi === 'undefined' ||
        !gapi.client ||
        !gapi.client.getToken()
      ) {
        observer.error('Google API client not loaded or not authenticated');
        return;
      }

      if (gapi.client.gmail) {
        observer.next(true);
        observer.complete();
        return;
      }

      gapi.client
        .load('gmail', 'v1')
        .then(() => {
          observer.next(true);
          observer.complete();
        })
        .catch((error: any) => {
          observer.error(`Failed to load Gmail API: ${error}`);
        });
    });
  }

  /**
   * Gets a list of emails from Gmail API
   */
  public getEmails(
    pageToken?: string,
    maxResults: number = this.API_BATCH_SIZE
  ): Observable<{
    emails: EmailListItem[];
    nextPageToken?: string;
  }> {
    return this.loadGmailApi().pipe(
      switchMap(() =>
        from(
          gapi.client.gmail.users.messages.list({
            userId: 'me',
            maxResults: maxResults,
            pageToken: pageToken || undefined,
          })
        )
      ),
      map((response) => response.result as EmailListResponse),
      switchMap((response) => {
        const emailPromises = response.messages.map((message) =>
          gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          })
        );

        return from(Promise.all(emailPromises)).pipe(
          map((responses) => ({
            emails: responses.map((resp) => {
              const message = resp.result as EmailContent;
              const headers = message.payload.headers;
              return {
                id: message.id,
                threadId: message.threadId,
                labelIds: message.labelIds,
                snippet: message.snippet,
                historyId: message.historyId,
                internalDate: message.internalDate,
                payload: {
                  headers: headers,
                  mimeType: message.payload.mimeType,
                  subject: headers.find(
                    (h) => h.name.toLowerCase() === 'subject'
                  )?.value,
                  from: headers.find((h) => h.name.toLowerCase() === 'from')
                    ?.value,
                  to: headers.find((h) => h.name.toLowerCase() === 'to')?.value,
                  date: headers.find((h) => h.name.toLowerCase() === 'date')
                    ?.value,
                },
              };
            }),
            nextPageToken: response.nextPageToken,
          }))
        );
      }),
      catchError((error) => {
        console.error('Error fetching emails:', error);
        return throwError(
          () => new Error('Failed to fetch emails. Please try again later.')
        );
      })
    );
  }

  /**
   * Gets a single email with full content
   */
  public getEmailContent(emailId: string): Observable<EmailContent> {
    return this.loadGmailApi().pipe(
      switchMap(() =>
        from(
          gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: emailId,
            format: 'full',
          })
        )
      ),
      map((response) => response.result as EmailContent),
      catchError((error) => {
        console.error('Error fetching email content:', error);
        return throwError(
          () =>
            new Error('Failed to fetch email content. Please try again later.')
        );
      })
    );
  }

  /**
   * Decodes base64 encoded email content
   */
  public decodeBase64(data: string): string {
    try {
      // Replace non-url compatible chars with base64 standard chars
      const safeData = data.replace(/-/g, '+').replace(/_/g, '/');

      // Add padding if needed
      const paddedData = safeData.padEnd(
        Math.ceil(safeData.length / 4) * 4,
        '='
      );

      return decodeURIComponent(
        atob(paddedData)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch (e) {
      console.error('Error decoding base64:', e);
      return 'Error decoding email content';
    }
  }

  /**
   * Gets the plain text content from an email
   */
  public getPlainTextContent(email: EmailContent): string {
    if (!email.payload.parts || email.payload.parts.length === 0) {
      // Handle emails without parts
      if (email.payload.body && email.payload.body.data) {
        return this.decodeBase64(email.payload.body.data);
      }
      return 'No content found';
    }

    // Find text/plain part
    const plainTextPart = email.payload.parts.find(
      (part) => part.mimeType === 'text/plain' && part.body && part.body.data
    );

    if (plainTextPart && plainTextPart.body.data) {
      return this.decodeBase64(plainTextPart.body.data);
    }

    // Find HTML part as fallback
    const htmlPart = email.payload.parts.find(
      (part) => part.mimeType === 'text/html' && part.body && part.body.data
    );

    if (htmlPart && htmlPart.body.data) {
      const htmlContent = this.decodeBase64(htmlPart.body.data);
      // Strip HTML tags for plain text (very simplistic)
      return htmlContent.replace(/<[^>]*>/g, '');
    }

    return 'No readable content found';
  }

  /**
   * Gets the HTML content from an email if available
   */
  public getHtmlContent(email: EmailContent): string | null {
    if (!email.payload.parts || email.payload.parts.length === 0) {
      // Handle emails without parts
      if (
        email.payload.mimeType === 'text/html' &&
        email.payload.body &&
        email.payload.body.data
      ) {
        return this.decodeBase64(email.payload.body.data);
      }
      return null;
    }

    // Find HTML part
    const htmlPart = email.payload.parts.find(
      (part) => part.mimeType === 'text/html' && part.body && part.body.data
    );

    if (htmlPart && htmlPart.body.data) {
      return this.decodeBase64(htmlPart.body.data);
    }

    return null;
  }
}
