using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Services
{
    public class RoomCleanupService : BackgroundService
    {
        private readonly IRoomService _roomService;
        private readonly ILogger<RoomCleanupService> _logger;
        private readonly TimeSpan _expiryTime = TimeSpan.FromMinutes(30);

        public RoomCleanupService(IRoomService roomService, ILogger<RoomCleanupService> logger)
        {
            _roomService = roomService;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Room Cleanup Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.UtcNow;
                    var roomsToExpire = _roomService.GetAllRooms()
                        .Where(r => now - r.LastActiveAt > _expiryTime)
                        .ToList();

                    foreach (var room in roomsToExpire)
                    {
                        _logger.LogInformation($"Expiring room: {room.RoomId}");
                        _roomService.RemoveRoom(room.RoomId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while cleaning up rooms.");
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }

            _logger.LogInformation("Room Cleanup Service is stopping.");
        }
    }
}
