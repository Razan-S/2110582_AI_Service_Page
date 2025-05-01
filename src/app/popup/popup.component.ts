import { CommonModule } from '@angular/common';
import { Component, NgZone, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BackendService } from '../services/backend.service';
import { MessageService } from 'primeng/api';
import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule

interface Result {
  isPhishing: string;
  score: number;
}

@Component({
  selector: 'app-popup',
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  providers: [MessageService, BackendService],
  standalone: true,
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.scss'
})
export class PopupComponent implements OnInit {
  isGmailTab = false;
  phishingForm!: FormGroup;
  result: Result = {
    isPhishing: '',
    score: 0
  };

  show: any = {}

  constructor(
    private ngZone: NgZone,
    private fb: FormBuilder,
    private backendService: BackendService,
    private ms: MessageService
  ) {
    this.createForm();

    document.addEventListener('DOMContentLoaded', () => {
      const button = document.getElementById('goToGmail');

      button?.addEventListener('click', () => {
        this.goToGmail();
      });
    });
  }

  createForm(): void {
    this.phishingForm = this.fb.group({
      title: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.checkIfGmailTab();

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.onActivated.addListener(() => {
        this.checkIfGmailTab();
      });

      chrome.tabs.onUpdated.addListener(() => {
        this.checkIfGmailTab();
      });
    } else {
      console.warn('Chrome extension APIs not available in development mode.');
      this.isGmailTab = false;
    }
  }

  checkIfGmailTab(): void {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
        this.ngZone.run(() => {
          const url = tabs[0]?.url || '';
          this.isGmailTab = url.includes('mail.google.com');
        });
      });
    } else {
      console.warn('Chrome extension APIs not available in development mode.');
      this.isGmailTab = false;
    }
  }

  goToGmail(): void {
    chrome.tabs.create({ url: 'https://mail.google.com/mail' });
  }

  submit(): void {
    if (this.phishingForm.invalid) {
      return;
    }
    
    const { title } = this.phishingForm.value;
    this.backendService.isThisPhishing(title).subscribe(
      (response: any) => {
        this.result = {
          isPhishing: response.is_phishing ? "Safe" : "Phishing",
          score: response.score
        };

      },
      (error: any) => {
        console.error('Error:', error);
        this.ms.add({
          severity: 'error',
          summary: 'Error',
          detail: 'An error occurred while checking the email. Please try again later.'
        });
      }
    );
  }

  reset(): void {
    this.phishingForm.reset();
    this.result = {
      isPhishing: '',
      score: 0
    }
  }
}
