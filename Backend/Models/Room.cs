using System;

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
    }
}
