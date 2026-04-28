import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { SignalrService } from '../../services/signalr.service';


import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  phoneNumber: string = '+91';
  loading: boolean = false;
  inviteLink: string = '';
  roomId: string = '';
  smsSent: boolean = false;

  private apiUrl = `${environment.apiUrl}/api/invite`;



  constructor(
    private http: HttpClient, 
    private router: Router,
    private signalrService: SignalrService
  ) {}

  createInvite(sendSms: boolean = true) {
    this.loading = true;
    const payload = sendSms ? { phoneNumber: this.phoneNumber, sendSms: true } : { phoneNumber: '', sendSms: false };
    this.http.post<any>(`${this.apiUrl}/create`, payload)

      .subscribe({
        next: (res) => {
          console.log('Create Invite API Response:', res);
          this.roomId = res.roomId;
          this.inviteLink = res.inviteLink;
          this.smsSent = res.smsSent;
          this.loading = false;
          
          // Connect to SignalR as Host and wait
          this.signalrService.startConnection(this.roomId);
          
          this.signalrService.roomActivated$.subscribe(() => {
            this.router.navigate(['/chat', this.roomId]);
          });

          this.signalrService.inviteDeclined$.subscribe(() => {
            alert('The guest has declined the invitation for this session.');
            this.inviteLink = '';
          });

        },
        error: (err) => {
          console.error(err);
          alert('Failed to create invite.');
          this.loading = false;
        }
      });
  }

  copyLink(inputElement: HTMLInputElement) {
    inputElement.select();
    document.execCommand('copy');
  }
}


