import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-congratulations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="congrats-container">
      <div class="glass-card">
        <div class="icon-success">🎉</div>
        <h1>Session Ended Successfully</h1>
        <p>Thank you for using PulseChat for secure communications.</p>
        <button class="btn-home" (click)="goHome()">Return Home</button>
      </div>
    </div>
  `,
  styles: [`
    .congrats-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #0b141a 0%, #121b22 100%);
      font-family: 'Segoe UI', sans-serif;
    }
    .glass-card {
      background: rgba(31, 44, 52, 0.6);
      backdrop-filter: blur(10px);
      padding: 40px;
      border-radius: 16px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
      max-width: 400px;
      animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes popIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .icon-success {
      font-size: 4rem;
      margin-bottom: 20px;
    }
    h1 {
      color: #00a884;
      margin-bottom: 15px;
      font-size: 1.8rem;
    }
    p {
      color: #e9edef;
      margin-bottom: 30px;
      line-height: 1.5;
    }
    .btn-home {
      background: #00a884;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 24px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn-home:hover {
      background: #008769;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 168, 132, 0.3);
    }
  `]
})
export class CongratulationsComponent {
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
  }
}
