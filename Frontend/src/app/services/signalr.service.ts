import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection!: signalR.HubConnection;
  
  // Observables for components
  public message$ = new Subject<{ sender: string, content: string }>();
  public signal$ = new Subject<{ sender: string, data: string }>();
  public userJoined$ = new Subject<string>();
  public userLeft$ = new Subject<string>();
  public roleAssigned$ = new BehaviorSubject<string>('');
  public peerConnected$ = new Subject<string>();
  public roomActivated$ = new Subject<void>();
  public inviteDeclined$ = new Subject<void>();
  public error$ = new Subject<string>();


  public connectionState$ = new BehaviorSubject<string>('Disconnected');

  private backendUrl = environment.apiUrl;



  public startConnection(roomId: string): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.backendUrl}/hubs/chat`, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    this.connectionState$.next('Connecting...');

    this.hubConnection
      .start()
      .then(() => {
        this.connectionState$.next('Connected');
        console.log('SignalR Connected');
        this.joinRoom(roomId);
      })
      .catch(err => {
        this.connectionState$.next('Failed');
        console.error('SignalR Connection Error: ', err);
        this.error$.next('Could not connect to server.');
      });

    this.registerHandlers();
  }

  private registerHandlers(): void {
    this.hubConnection.on('ReceiveMessage', (sender: string, content: string) => {
      this.message$.next({ sender, content });
    });

    this.hubConnection.on('ReceiveSignal', (sender: string, data: string) => {
      this.signal$.next({ sender, data });
    });

    this.hubConnection.on('UserJoined', (connectionId: string) => {
      this.userJoined$.next(connectionId);
    });

    this.hubConnection.on('UserLeft', (connectionId: string) => {
      this.userLeft$.next(connectionId);
    });

    this.hubConnection.on('RoleAssigned', (role: string) => {
      this.roleAssigned$.next(role);
    });

    this.hubConnection.on('PeerConnected', (connectionId: string) => {
      this.peerConnected$.next(connectionId);
    });

    this.hubConnection.on('RoomActivated', () => {
      this.roomActivated$.next();
    });

    this.hubConnection.on('InviteDeclined', () => {
      this.inviteDeclined$.next();
    });

    this.hubConnection.on('Error', (message: string) => {
      this.error$.next(message);
    });
  }

  public claimRoom(roomId: string, code: string): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('ClaimRoom', roomId, code)
        .catch(err => console.error('ClaimRoom Error: ', err));
    }
  }

  public declineInvite(roomId: string): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('DeclineInvite', roomId)
        .catch(err => console.error('DeclineInvite Error: ', err));
    }
  }



  private joinRoom(roomId: string): void {
    this.hubConnection.invoke('JoinRoom', roomId)
      .catch(err => console.error('JoinRoom Error: ', err));
  }

  public sendMessage(roomId: string, message: string): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('SendMessage', roomId, message)
        .catch(err => console.error('SendMessage Error: ', err));
    }
  }

  public sendSignal(roomId: string, signalData: any): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      const signalJson = JSON.stringify(signalData);
      this.hubConnection.invoke('SendSignal', roomId, signalJson)
        .catch(err => console.error('SendSignal Error: ', err));
    }
  }

  public disconnect(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.connectionState$.next('Disconnected');
    }
  }
}
