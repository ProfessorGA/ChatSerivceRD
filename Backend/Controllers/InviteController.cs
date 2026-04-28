using Microsoft.AspNetCore.Mvc;
using Backend.Services;
using System;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InviteController : ControllerBase
    {
        private readonly IRoomService _roomService;
        private readonly ISmsService _smsService;

        public InviteController(IRoomService roomService, ISmsService smsService)
        {
            _roomService = roomService;
            _smsService = smsService;
        }

        [HttpPost("create")]
        public IActionResult CreateInvite([FromBody] InviteRequest request)
        {
            if (string.IsNullOrEmpty(request.PhoneNumber))
            {
                return BadRequest(new { message = "Phone number is required." });
            }

            var roomId = _roomService.CreateRoom(request.PhoneNumber);
            
            // Generate invite link
            // Assuming frontend runs on localhost:4200 for now, or we can pass base URL from config
            var frontendUrl = "http://localhost:4200"; // Fallback
            var inviteLink = $"{frontendUrl}/join/{roomId}";

            bool smsSent = _smsService.SendInviteSms(request.PhoneNumber, inviteLink);

            return Ok(new 
            { 
                roomId = roomId, 
                inviteLink = inviteLink, 
                smsSent = smsSent,
                message = "Invite created successfully."
            });
        }

        [HttpGet("join/{roomId}")]
        public IActionResult ValidateJoin(string roomId)
        {
            var room = _roomService.GetRoom(roomId);
            if (room == null)
            {
                return NotFound(new { valid = false, message = "Room not found or expired." });
            }

            if (!_roomService.CanJoin(roomId))
            {
                return BadRequest(new { valid = false, message = "Room is full (Max 2 participants)." });
            }

            return Ok(new { valid = true, message = "Access granted." });
        }
    }

    public class InviteRequest
    {
        public string PhoneNumber { get; set; } = string.Empty;
    }
}
