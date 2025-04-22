import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmailService, EmailListItem } from '../../../services/email.service';

// PrimeNG components
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PaginatorModule } from 'primeng/paginator';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ToolbarModule } from 'primeng/toolbar';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-email-list',
  templateUrl: './email-list.component.html',
  styleUrls: ['./email-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ProgressSpinnerModule,
    ToastModule,
    PaginatorModule,
    CardModule,
    TagModule,
    SkeletonModule,
    ToolbarModule,
    DividerModule,
    TooltipModule
  ],
  providers: [MessageService]
})
export class EmailListComponent implements OnInit {
  emails: EmailListItem[] = [];
  loading = false;
  error = '';
  searchTerm = '';
  first = 0;
  rows = 10;
  totalRecords = 0;
  nextPageToken?: string;
  
  // Skeletons for loading state
  skeletonItems = Array(5).fill(0).map((_, i) => i);
  
  constructor(
    private emailService: EmailService,
    private router: Router,
    private messageService: MessageService
  ) {}
  
  ngOnInit(): void {
    this.loadEmails();
  }
  
  /**
   * Loads emails from the Gmail API
   */
  loadEmails(pageToken?: string): void {
    this.loading = true;
    this.error = '';
    
    this.emailService.getEmails(pageToken, this.rows).subscribe({
      next: (result) => {
        // Extract the flattened observable result
        const innerObservable = result as any;
        innerObservable.subscribe({
          next: (data: { emails: EmailListItem[], nextPageToken?: string }) => {
            this.emails = data.emails;
            this.nextPageToken = data.nextPageToken;
            this.totalRecords = this.emails.length + (this.nextPageToken ? 100 : 0); // Approximate total
            this.loading = false;
          },
          error: (err: Error) => {
            this.handleError(err);
          }
        });
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }
  
  /**
   * Handles API errors
   */
  private handleError(error: any): void {
    this.loading = false;
    this.error = error.message || 'Failed to load emails';
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: this.error,
      life: 5000
    });
    console.error('Email list error:', error);
  }
  
  // View a specific email
  viewEmail(email: EmailListItem): void {
    if (!email?.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No email selected'
      });
      return;
    }

    // Option 1: Navigate to detail view
    this.router.navigate(['/emails', email.id]);

    // Option 2: Open in a dialog (uncomment if using dialog)
    // this.dialog.open(EmailDetailComponent, {
    //   data: { emailId: email.id },
    //   width: '80%',
    //   height: '90%'
    // });
  }
  
  /**
   * Loads the next page of emails
   */
  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    
    // Only load new data if we have a next page token
    if (this.first > 0 && this.nextPageToken) {
      this.loadEmails(this.nextPageToken);
    }
  }
  
  /**
   * Gets the sender name from the email address
   */
  getSenderName(from: string | undefined): string {
    if (!from) return 'Unknown Sender';
    
    // Check if the format is "Name <email@example.com>"
    const match = from.match(/^([^<]+)/);
    if (match && match[1]) {
      return match[1].trim();
    }
    
    return from;
  }
  
  /**
   * Gets the sender email from the full address
   */
  getSenderEmail(from: string | undefined): string {
    if (!from) return '';
    
    // Extract email address from "Name <email@example.com>"
    const match = from.match(/<([^>]+)>/);
    if (match && match[1]) {
      return match[1];
    }
    
    return from;
  }
  
  /**
   * Formats a date string
   */
  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      
      // If it's today, show only the time
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // If it's this year, show day and month
      if (date.getFullYear() === today.getFullYear()) {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
      
      // If it's a different year, show day, month and year
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  }
  
  /**
   * Refreshes the email list
   */
  refreshEmails(): void {
    this.nextPageToken = undefined;
    this.first = 0;
    this.loadEmails();
  }
  
  /**
   * Filters emails by search term
   */
  filterEmails(): void {
    if (!this.searchTerm.trim()) {
      this.refreshEmails();
      return;
    }
    
    // In a real application, we would call the API with search parameters
    // For now, we'll just filter the existing emails
    this.messageService.add({
      severity: 'info',
      summary: 'Search',
      detail: `Searching for "${this.searchTerm}" (client-side only)`,
      life: 3000
    });
  }
  
  /**
   * Determines if an email has attachments
   */
  hasAttachments(email: EmailListItem): boolean {
    // In a real implementation, this would check the email for attachments
    // For this demo, let's just return a random boolean
    return email.id.charCodeAt(0) % 3 === 0;
  }
  
  /**
   * Gets a severity class for different email types (for demonstration)
   */
  getSeverity(email: EmailListItem): string {
    // For demonstration purposes only
    const id = email.id || '';
    
    if (id.charCodeAt(0) % 5 === 0) return 'success';
    if (id.charCodeAt(0) % 7 === 0) return 'warning';
    if (id.charCodeAt(0) % 11 === 0) return 'danger';
    if (id.charCodeAt(0) % 3 === 0) return 'info';
    
    return 'secondary';
  }
}
