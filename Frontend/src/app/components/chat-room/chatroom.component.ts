import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { SignalrService } from '../../services/signalr.service';
import { WebrtcService } from '../../services/webrtc.service';
import { Subscription } from 'rxjs';

interface Message {
  content: string;
  isMe: boolean;
  time: Date;
}

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.css']
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatWindow') private chatWindow!: ElementRef;

  roomId: string = '';
  myRole: string = '';
  connectionState: string = 'Disconnected';
  newMessage: string = '';
  messages: Message[] = [];

  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;
  
  isAudioOnly: boolean = false;
  isVideoCall: boolean = false;

  // Toggles
  isCameraOn: boolean = true;
  isMicOn: boolean = true;
  isSpeakerOn: boolean = true;
  isMirrorOn: boolean = false;

  // Activity Tracking
  activityPopupMessage: string = '';
  showActivityPopup: boolean = false;

  private subs = new Subscription();
  private peerConnection!: RTCPeerConnection;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private signalrService: SignalrService,
    private webrtcService: WebrtcService
  ) {}


  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
    if (this.roomId) {
      this.signalrService.startConnection(this.roomId);
      this.setupSubscriptions();
      this.setupActivityTracking();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.signalrService.disconnect();
    this.webrtcService.endCall();
  }

  toggleCamera() {
    this.isCameraOn = !this.isCameraOn;
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => track.enabled = this.isCameraOn);
    }
  }

  toggleMic() {
    this.isMicOn = !this.isMicOn;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => track.enabled = this.isMicOn);
    }
  }

  toggleSpeaker() {
    this.isSpeakerOn = !this.isSpeakerOn;
  }

  toggleMirror() {
    this.isMirrorOn = !this.isMirrorOn;
  }

  private setupActivityTracking() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.signalrService.notifyActivity(this.roomId, 'Tab changed or Screen locked');
      }
    });

    window.addEventListener('blur', () => {
      this.signalrService.notifyActivity(this.roomId, 'App switched or Call attended');
    });
  }


  closePopup() {
    this.showActivityPopup = false;
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private setupSubscriptions(): void {
    // Connection State
    this.subs.add(this.signalrService.connectionState$.subscribe(state => {
      this.connectionState = state;
    }));

    // Role Assignment
    this.subs.add(this.signalrService.roleAssigned$.subscribe(role => {
      this.myRole = role;
    }));

    // Messages
    this.subs.add(this.signalrService.message$.subscribe(msg => {
      this.messages.push({
        content: msg.content,
        isMe: msg.isMe,
        time: new Date()
      });
    }));

    // Remote Activity Alerts
    this.subs.add(this.signalrService.activityAlert$.subscribe(reason => {
      this.activityPopupMessage = `Peer Alert: ${reason}`;
      this.showActivityPopup = true;
    }));

    // Session Ended
    this.subs.add(this.signalrService.sessionEnded$.subscribe(() => {
      this.router.navigate(['/congratulations']);
    }));


    // Peer Joined (For Host to initiate call if needed, or just log)
    this.subs.add(this.signalrService.peerConnected$.subscribe(() => {
      console.log('Peer joined the room.');
    }));

    // WebRTC Signaling Data
    this.subs.add(this.signalrService.signal$.subscribe(async signal => {
      const data = JSON.parse(signal.data);

      if (data.offer) {
        await this.answerCall(data.offer);
      } else if (data.answer) {
        await this.webrtcService.handleAnswer(data.answer);
      } else if (data.candidate) {
        await this.webrtcService.addIceCandidate(data.candidate);
      }
    }));

    // Streams
    this.subs.add(this.webrtcService.localStream$.subscribe(stream => {
      this.localStream = stream;
    }));

    this.subs.add(this.webrtcService.remoteStream$.subscribe(stream => {
      this.remoteStream = stream;
    }));

    this.subs.add(this.webrtcService.callEnded$.subscribe(() => {
      this.localStream = null;
      this.remoteStream = null;
      this.isVideoCall = false;
      this.isAudioOnly = false;
    }));
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    this.signalrService.sendMessage(this.roomId, this.newMessage);
    this.newMessage = '';
  }


  // WebRTC Call Logic
  async startVideoCall() {
    this.isVideoCall = true;
    this.isAudioOnly = false;
    await this.initiateCall(true, true);
  }

  async startAudioCall() {
    this.isAudioOnly = true;
    this.isVideoCall = false;
    await this.initiateCall(false, true);
  }

  private async initiateCall(video: boolean, audio: boolean) {
    try {
      await this.webrtcService.startLocalStream(video, audio);
      this.peerConnection = this.webrtcService.createPeerConnection((candidateData) => {
        this.signalrService.sendSignal(this.roomId, candidateData);
      });

      const offer = await this.webrtcService.createOffer();
      this.signalrService.sendSignal(this.roomId, { offer });
    } catch (err) {
      console.error('Failed to initiate call:', err);
      alert('Could not access camera/microphone.');
      this.isVideoCall = false;
      this.isAudioOnly = false;
    }
  }

  private async answerCall(offer: any) {
    try {
      // Automatically accept call with matching tracks (or prompt user)
      const video = this.isVideoCall || true; // Default to video for simplicity or ask
      await this.webrtcService.startLocalStream(video, true);
      
      this.peerConnection = this.webrtcService.createPeerConnection((candidateData) => {
        this.signalrService.sendSignal(this.roomId, candidateData);
      });

      const answer = await this.webrtcService.handleOffer(offer);
      this.signalrService.sendSignal(this.roomId, { answer });
    } catch (err) {
      console.error('Failed to answer call:', err);
    }
  }

  endCall(): void {
    this.webrtcService.endCall();
    this.signalrService.endSession(this.roomId);
  }


  private scrollToBottom(): void {
    try {
      this.chatWindow.nativeElement.scrollTop = this.chatWindow.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
