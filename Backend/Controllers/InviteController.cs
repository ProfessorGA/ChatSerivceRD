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
            if (request.SendSms != false && string.IsNullOrEmpty(request.PhoneNumber))
            {
                return BadRequest(new { message = "Phone number is required." });
            }

            var phoneNumber = string.IsNullOrEmpty(request.PhoneNumber) ? "MANUAL" : request.PhoneNumber;
            var roomId = _roomService.CreateRoom(phoneNumber);
            
            var frontendUrl = "http://localhost:4200"; // Fallback
            if (Request.Headers.TryGetValue("Origin", out var originValues))
            {
                var origin = originValues.FirstOrDefault();
                if (!string.IsNullOrEmpty(origin))
                {
                    frontendUrl = origin.TrimEnd('/');
                }
            }
            var inviteLink = $"{frontendUrl}/join/{roomId}";

            bool smsSent = false;
            string? errorMessage = null;

            if (request.SendSms != false)
            {
                (smsSent, errorMessage) = _smsService.SendInviteSms(request.PhoneNumber, inviteLink);
            }

            return Ok(new 
            { 
                roomId = roomId, 
                inviteLink = inviteLink, 
                smsSent = smsSent,
                errorMessage = errorMessage,
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
        public bool? SendSms { get; set; }
    }

}
