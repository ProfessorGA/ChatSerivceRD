import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebrtcService {
  private peerConnection!: RTCPeerConnection;
  private localStream!: MediaStream;
  
  public remoteStream$ = new Subject<MediaStream>();
  public localStream$ = new Subject<MediaStream>();
  public callEnded$ = new Subject<void>();

  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  public async startLocalStream(video: boolean, audio: boolean): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video, audio });
      this.localStream$.next(this.localStream);
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices.', error);
      throw error;
    }
  }

  public createPeerConnection(onIceCandidate: (candidate: any) => void): RTCPeerConnection {
    this.peerConnection = new RTCPeerConnection(this.configuration);

    // Add local tracks to connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // ICE Candidate handler
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate({ candidate: event.candidate });
      }
    };

    // Track event (remote stream)
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream$.next(event.streams[0]);
      }
    };

    return this.peerConnection;
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  public async handleOffer(offerSdp: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offerSdp));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  public async handleAnswer(answerSdp: RTCSessionDescriptionInit): Promise<void> {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answerSdp));
  }

  public async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error('Error adding ice candidate', e);
    }
  }

  public endCall(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    this.callEnded$.next();
  }
}
