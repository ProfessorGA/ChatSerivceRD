import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalrService } from '../../services/signalr.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  username = '';
  password = '';
  isAuthenticated = false;
  authError = '';
  rooms: any[] = [];
  selectedRoom: any = null;
  activeRoomMessages: any[] = [];

  constructor(private signalrService: SignalrService) {}

  ngOnInit(): void {
    this.signalrService.hubConnection?.on('AdminReceiveMessage', (roomId: string, role: string, content: string) => {
      if (this.selectedRoom?.roomId === roomId) {
        this.activeRoomMessages.push({ role, content, flagged: false });
      }
    });

    this.signalrService.hubConnection?.on('MessageFlagged', (roomId: string, role: string, content: string) => {
      if (this.selectedRoom?.roomId === roomId) {
        this.activeRoomMessages.push({ role, content, flagged: true });
      }
    });

    this.signalrService.hubConnection?.on('RoomListUpdated', (rooms: any[]) => {
      this.rooms = rooms;
    });
  }

  login() {
    if (this.username === 'admin' && this.password === 'admin123') {
      this.isAuthenticated = true;
      this.signalrService.startConnection();
      
      const sub = this.signalrService.connectionState$.subscribe(state => {
        if (state === 'Connected') {
          this.signalrService.hubConnection?.invoke('AdminJoin');
          
          this.signalrService.hubConnection?.on('RoomListUpdated', (rooms: any[]) => {
            this.rooms = rooms;
          });

          this.signalrService.hubConnection?.on('AdminReceiveMessage', (roomId: string, role: string, content: string) => {
            if (this.selectedRoom?.roomId === roomId) {
              this.activeRoomMessages.push({ role, content, flagged: false });
            }
          });

          this.signalrService.hubConnection?.on('MessageFlagged', (roomId: string, role: string, content: string) => {
            if (this.selectedRoom?.roomId === roomId) {
              this.activeRoomMessages.push({ role, content, flagged: true });
            }
          });

          sub.unsubscribe();
        }
      });
    } else {
      this.authError = 'Access unauthorized.';
    }
  }


  selectRoom(room: any) {
    this.selectedRoom = room;
    this.activeRoomMessages = [];
  }

  warnUser(connId: string) {
    this.signalrService.hubConnection?.invoke('WarnUser', this.selectedRoom.roomId, connId);
  }

  muteUser(connId: string) {
    this.signalrService.hubConnection?.invoke('MuteUser', this.selectedRoom.roomId, connId);
  }

  kickUser(connId: string) {
    this.signalrService.hubConnection?.invoke('KickUser', this.selectedRoom.roomId, connId);
  }
}
