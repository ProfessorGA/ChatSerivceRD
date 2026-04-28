import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SignalrService } from '../../services/signalr.service';

@Component({
  selector: 'app-claim',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './claim.component.html',
  styleUrls: ['./claim.component.css']
})
export class ClaimComponent implements OnInit {
  roomId: string = '';
  code: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private signalrService: SignalrService
  ) {}

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
  }

  claim(): void {
    if (this.code === '1998') {
      // Connect to SignalR as Guest
      this.signalrService.startConnection(this.roomId);
      
      // Call Claim logic
      setTimeout(() => {
        this.signalrService.claimRoom(this.roomId, this.code);
        // Redirect to chat
        this.router.navigate(['/chat', this.roomId]);
      }, 1000); // Small delay to ensure connection is ready
    } else {
      alert('Invalid security code. Please try again.');
    }
  }
}
