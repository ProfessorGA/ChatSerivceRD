import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ChatRoomComponent } from './components/chat-room/chatroom.component';
import { ClaimComponent } from './components/claim/claim.component';
import { AvoidComponent } from './components/avoid/avoid.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'join/:roomId', component: ClaimComponent },
  { path: 'avoid/:roomId', component: AvoidComponent },
  { path: 'chat/:roomId', component: ChatRoomComponent },
  { path: '**', redirectTo: '' }
];
