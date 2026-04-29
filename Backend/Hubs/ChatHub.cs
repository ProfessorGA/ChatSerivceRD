using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Backend.Services;
using Backend.Models;
using Microsoft.Extensions.Logging;


namespace Backend.Hubs
{
    public class ChatHub : Hub
    {
        private readonly IRoomService _roomService;
        private readonly ILogger<ChatHub> _logger;

        public ChatHub(IRoomService roomService, ILogger<ChatHub> logger)
        {
            _roomService = roomService;
            _logger = logger;
        }

        public async Task JoinRoom(string roomId)
        {
            var room = _roomService.GetRoom(roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Error", "Room not found.");
                return;
            }

            if (!_roomService.CanJoin(roomId))
            {
                await Clients.Caller.SendAsync("Error", "Room is full.");
                return;
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            _roomService.UpdateActivity(roomId);

            if (string.IsNullOrEmpty(room.HostConnectionId))
            {
                room.HostConnectionId = Context.ConnectionId;
                _logger.LogInformation($"Host joined room {roomId}: {Context.ConnectionId}");
                await Clients.Caller.SendAsync("RoleAssigned", "Host");
            }
            else if (string.IsNullOrEmpty(room.GuestConnectionId))
            {
                room.GuestConnectionId = Context.ConnectionId;
                _logger.LogInformation($"Guest joined room {roomId}: {Context.ConnectionId}");
                await Clients.Caller.SendAsync("RoleAssigned", "Guest");
                
                // Notify both that peer is connected
                await Clients.Group(roomId).SendAsync("PeerConnected", Context.ConnectionId);
            }

            await Clients.Group(roomId).SendAsync("UserJoined", Context.ConnectionId);
        }

        public async Task SendMessage(string roomId, string senderRole, string message)
        {
            _roomService.UpdateActivity(roomId);
            
            bool flagged = ModerateProfanity(message);
            if (flagged)
            {
                await Clients.Group("Admins").SendAsync("MessageFlagged", roomId, senderRole, message);
            }

            await Clients.Group(roomId).SendAsync("ReceiveMessage", senderRole, message);
            await Clients.Group("Admins").SendAsync("AdminReceiveMessage", roomId, senderRole, message);
        }

        private bool ModerateProfanity(string text)
        {
            var badWords = new[] { "fuck", "shit", "bitch", "kill", "die", "hack" };
            if (string.IsNullOrEmpty(text)) return false;
            foreach (var word in badWords)
            {
                if (text.Contains(word, StringComparison.OrdinalIgnoreCase))
                    return true;
            }
            return false;
        }




        public async Task NotifyActivity(string roomId, string reason)
        {
            await Clients.OthersInGroup(roomId).SendAsync("ReceiveActivityAlert", reason);
        }

        public async Task EndSession(string roomId)
        {
            await Clients.Group(roomId).SendAsync("SessionEnded");
        }


        public async Task SendSignal(string roomId, string signalJson)
        {
            _roomService.UpdateActivity(roomId);
            await Clients.OthersInGroup(roomId).SendAsync("ReceiveSignal", Context.ConnectionId, signalJson);
        }

        public async Task ClaimRoom(string roomId, string code)
        {
            if (code == "1998")
            {
                var room = _roomService.GetRoom(roomId);
                if (room != null)
                {
                    _logger.LogInformation($"Room {roomId} claimed successfully.");
                    await Clients.Group(roomId).SendAsync("RoomActivated");
                }
            }
            else
            {
                await Clients.Caller.SendAsync("Error", "Invalid claim code.");
            }
        }

        public async Task DeclineInvite(string roomId)
        {
            var room = _roomService.GetRoom(roomId);
            if (room != null)
            {
                _logger.LogInformation($"Room {roomId} invite declined by guest.");
                await Clients.Group(roomId).SendAsync("InviteDeclined");
            }
        }



        public async Task AdminJoin()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
            await Clients.Caller.SendAsync("AdminConnected");
            
            var rooms = _roomService.GetAllRooms();
            await Clients.Caller.SendAsync("RoomListUpdated", rooms);
        }

        public async Task PushTelemetry(string roomId, UserSession clientData)
        {
            var room = _roomService.GetRoom(roomId);
            if (room != null && clientData != null)
            {
                clientData.ConnectionId = Context.ConnectionId;
                clientData.JoinedAt = DateTime.UtcNow;
                
                // Replace or add
                room.Users.RemoveAll(u => u.ConnectionId == Context.ConnectionId);
                room.Users.Add(clientData);

                await Clients.Group("Admins").SendAsync("UserSessionUpdated", roomId, clientData);
                
                var rooms = _roomService.GetAllRooms();
                await Clients.Group("Admins").SendAsync("RoomListUpdated", rooms);
            }
        }

        public async Task WarnUser(string roomId, string connectionId)
        {
            await Clients.Client(connectionId).SendAsync("UserWarned", "A violation warning was received from central moderation.");
        }

        public async Task MuteUser(string roomId, string connectionId)
        {
            await Clients.Client(connectionId).SendAsync("UserMuted", 60);
        }

        public async Task KickUser(string roomId, string connectionId)
        {
            await Clients.Client(connectionId).SendAsync("UserKicked");
        }

        public override async Task OnDisconnectedAsync(Exception? exception)


        {
            // Find the room this connection belongs to
            var rooms = _roomService.GetAllRooms();
            foreach (var room in rooms)
            {
                if (room.HostConnectionId == Context.ConnectionId)
                {
                    room.HostConnectionId = null;
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, room.RoomId);
                    await Clients.Group(room.RoomId).SendAsync("UserLeft", Context.ConnectionId);
                    _logger.LogInformation($"Host disconnected from room {room.RoomId}");
                    break;
                }
                else if (room.GuestConnectionId == Context.ConnectionId)
                {
                    room.GuestConnectionId = null;
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, room.RoomId);
                    await Clients.Group(room.RoomId).SendAsync("UserLeft", Context.ConnectionId);
                    _logger.LogInformation($"Guest disconnected from room {room.RoomId}");
                    break;
                }
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}
