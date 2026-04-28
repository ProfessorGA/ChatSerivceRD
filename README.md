# PulseChat - Invite-Only Chat & Call

A real-time, session-based video/audio chat application built with Angular and .NET Core Web API.

## Tech Stack
- **Frontend**: Angular 18
- **Backend**: .NET Core 10 Web API
- **Real-time**: SignalR
- **Calls**: WebRTC

## Setup Instructions

### Prerequisites
- .NET 10 SDK
- Node.js (v20+)

### Backend
1. Open terminal in `Backend` folder.
2. (Optional) Configure Twilio in `appsettings.json`:
   ```json
   "Twilio": {
     "AccountSid": "your_sid",
     "AuthToken": "your_token",
     "FromNumber": "your_twilio_number"
   }
   ```
   *Note: If credentials are missing, the system logs the invite link to the console as a fallback.*
3. Run the API:
   ```bash
   dotnet run
   ```
   *API will be available at `http://localhost:5135`.*

### Frontend
1. Open terminal in `Frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the application:
   ```bash
   npm start
   ```
   *App will be available at `http://localhost:4200`.*

### Opening in Visual Studio
Open the solution file `InviteVideoChat.slnx` at the root directory.
