import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SignalrService } from '../../services/signalr.service';

@Component({
  selector: 'app-avoid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avoid.component.html',
  styleUrls: ['./avoid.component.css']
})
export class AvoidComponent implements OnInit {
  roomId: string = '';

  constructor(
    private route: ActivatedRoute,
    private signalrService: SignalrService
  ) {}

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
    if (this.roomId) {
      this.signalrService.startConnection(this.roomId);
      
      // Wait for connection to be ready then decline
      setTimeout(() => {
        this.signalrService.declineInvite(this.roomId);
      }, 1500);
    }
  }
}
