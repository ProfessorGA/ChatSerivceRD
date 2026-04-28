using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using Backend.Models;

namespace Backend.Services
{
    public interface IRoomService
    {
        string CreateRoom(string hostPhoneNumber);
        Room? GetRoom(string roomId);
        bool CanJoin(string roomId);
        void UpdateActivity(string roomId);
        void RemoveRoom(string roomId);
        IEnumerable<Room> GetAllRooms();
    }

    public class RoomService : IRoomService
    {
        private readonly ConcurrentDictionary<string, Room> _rooms = new ConcurrentDictionary<string, Room>();

        public string CreateRoom(string hostPhoneNumber)
        {
            var roomId = Guid.NewGuid().ToString();
            var room = new Room
            {
                RoomId = roomId,
                HostPhoneNumber = hostPhoneNumber,
                CreatedAt = DateTime.UtcNow,
                LastActiveAt = DateTime.UtcNow,
                IsActive = true
            };
            _rooms.TryAdd(roomId, room);
            return roomId;
        }

        public Room? GetRoom(string roomId)
        {
            if (_rooms.TryGetValue(roomId, out var room))
            {
                return room;
            }
            return null;
        }

        public bool CanJoin(string roomId)
        {
            if (_rooms.TryGetValue(roomId, out var room))
            {
                // Allow join if less than 2 users
                int count = 0;
                if (!string.IsNullOrEmpty(room.HostConnectionId)) count++;
                if (!string.IsNullOrEmpty(room.GuestConnectionId)) count++;
                return count < 2;
            }
            return false;
        }

        public void UpdateActivity(string roomId)
        {
            if (_rooms.TryGetValue(roomId, out var room))
            {
                room.LastActiveAt = DateTime.UtcNow;
            }
        }

        public void RemoveRoom(string roomId)
        {
            _rooms.TryRemove(roomId, out _);
        }

        public IEnumerable<Room> GetAllRooms()
        {
            return _rooms.Values;
        }
    }
}
