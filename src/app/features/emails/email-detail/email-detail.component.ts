import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EmailService, EmailContent } from '../../../services/email.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// PrimeNG components
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';

@Component({
  selector: 'app-email-detail',
  templateUrl: './email-detail.component.html',
  styleUrls: ['./email-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ProgressSpinnerModule,
    ToastModule,
    DividerModule,
    PanelModule
  ],
  providers: [MessageService]
})
export class EmailDetailComponent implements OnInit {
  email: EmailContent | null = null;
  loading = true;
  error = '';
  emailHtml: SafeHtml | null = null;
  emailText: string | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private emailService: EmailService,
    private sanitizer: DomSanitizer,
    private messageService: MessageService
  ) {}
  
  ngOnInit(): void {
    const emailId = this.route.snapshot.paramMap.get('id');
    if (emailId) {
      this.loadEmail(emailId);
    } else {
      this.handleError(new Error('Email ID not provided'));
      this.router.navigate(['/emails']);
    }
  }
  
  /**
   * Loads the email content from the Gmail API
   */
  loadEmail(emailId: string): void {
    this.loading = true;
    this.error = '';
    
    this.emailService.getEmailContent(emailId).subscribe({
      next: (email) => {
        this.email = email;
        
        // Process email content
        this.processEmailContent();
        
        this.loading = false;
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }
  
  /**
   * Processes the email content for display
   */
  private processEmailContent(): void {
    if (!this.email) return;
    
    // Try to get HTML content first
    const htmlContent = this.emailService.getHtmlContent(this.email);
    if (htmlContent) {
      // Sanitize HTML to prevent XSS
      this.emailHtml = this.sanitizer.bypassSecurityTrustHtml(htmlContent);
    }
    
    // Get plain text content as fallback
    this.emailText = this.emailService.getPlainTextContent(this.email);
  }
  
  /**
   * Handles API errors
   */
  private handleError(error: any): void {
    this.loading = false;
    this.error = error.message || 'Failed to load email content';
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: this.error
    });
    console.error('Email detail error:', error);
  }
  
  /**
   * Navigates back to the email list
   */
  goBack(): void {
    this.router.navigate(['/emails']);
  }
  
  /**
   * Gets the sender name from the email headers
   */
  getSender(): string {
    if (!this.email) return 'Unknown';
    
    const fromHeader = this.email.payload.headers.find(
      h => h.name.toLowerCase() === 'from'
    );
    
    if (!fromHeader) return 'Unknown';
    
    // Check if the format is "Name <email@example.com>"
    const match = fromHeader.value.match(/^([^<]+)/);
    if (match && match[1]) {
      return match[1].trim();
    }
    
    return fromHeader.value;
  }
  
  /**
   * Gets the recipient from the email headers
   */
  getRecipient(): string {
    if (!this.email) return 'Unknown';
    
    const toHeader = this.email.payload.headers.find(
      h => h.name.toLowerCase() === 'to'
    );
    
    return toHeader?.value || 'Unknown';
  }
  
  /**
   * Gets the subject from the email headers
   */
  getSubject(): string {
    if (!this.email) return 'No Subject';
    
    const subjectHeader = this.email.payload.headers.find(
      h => h.name.toLowerCase() === 'subject'
    );
    
    return subjectHeader?.value || 'No Subject';
  }
  
  /**
   * Gets the date from the email headers
   */
  getDate(): string {
    if (!this.email) return '';
    
    const dateHeader = this.email.payload.headers.find(
      h => h.name.toLowerCase() === 'date'
    );
    
    if (!dateHeader) return '';
    
    try {
      const date = new Date(dateHeader.value);
      return date.toLocaleString();
    } catch (e) {
      return dateHeader.value;
    }
  }
}

