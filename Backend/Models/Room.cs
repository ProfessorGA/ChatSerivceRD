using System.Collections.Generic;

namespace Backend.Models
{
    public class Room
    {
        public string RoomId { get; set; } = string.Empty;
        public string? HostConnectionId { get; set; }
        public string? GuestConnectionId { get; set; }
        public string HostPhoneNumber { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime LastActiveAt { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsCallActive { get; set; } = false;
        public string CallType { get; set; } = "None"; // Audio, Video, None
        public DateTime? CallStartedAt { get; set; }
        public List<UserSession> Users { get; set; } = new List<UserSession>();
    }


    public class UserSession
    {
        public string ConnectionId { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
        public string DeviceType { get; set; } = string.Empty;
        public string OS { get; set; } = string.Empty;
        public string Browser { get; set; } = string.Empty;
        public string ScreenResolution { get; set; } = string.Empty;
        public string NetworkType { get; set; } = string.Empty;
        public string BatteryCharge { get; set; } = string.Empty;
        public string LiveLocation { get; set; } = string.Empty;
        public string ApproxLocation { get; set; } = string.Empty;
        public string CurrentState { get; set; } = "Idle"; // Chatting, In Call, Idle
        public int ViolationCount { get; set; } = 0;
        public bool IsMuted { get; set; } = false;
        public DateTime MuteExpiresAt { get; set; } = DateTime.MinValue;
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }

}

