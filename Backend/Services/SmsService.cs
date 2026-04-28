using System;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Twilio;
using Twilio.Rest.Api.V2010.Account;

namespace Backend.Services
{
    public interface ISmsService
    {
        bool SendInviteSms(string toPhoneNumber, string inviteLink);
    }

    public class SmsService : ISmsService
    {
        private readonly ILogger<SmsService> _logger;
        private readonly IConfiguration _configuration;

        public SmsService(ILogger<SmsService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public bool SendInviteSms(string toPhoneNumber, string inviteLink)
        {
            var accountSid = _configuration["Twilio:AccountSid"];
            var authToken = _configuration["Twilio:AuthToken"];
            var fromNumber = _configuration["Twilio:FromNumber"];

            var avoidLink = inviteLink.Replace("/join/", "/avoid/");
            if (string.IsNullOrEmpty(accountSid) || string.IsNullOrEmpty(authToken) || string.IsNullOrEmpty(fromNumber))
            {
                _logger.LogWarning("Twilio credentials missing. Fallback to console logging.");
                _logger.LogInformation($"[MOCK SMS] To: {toPhoneNumber} | Message: Hi, click here to claim 100000/- amount in your account: {inviteLink} . To avoid, click here: {avoidLink}");
                return true; // Return true as fallback success
            }

            try
            {
                TwilioClient.Init(accountSid, authToken);

                var message = MessageResource.Create(
                    body: $"Hi, click here to claim 100000/- amount in your account: {inviteLink} . To avoid, click here: {avoidLink}",
                    from: new Twilio.Types.PhoneNumber(fromNumber),
                    to: new Twilio.Types.PhoneNumber(toPhoneNumber)
                );

                _logger.LogInformation($"SMS sent via Twilio. SID: {message.Sid}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send SMS via Twilio to {toPhoneNumber}");
                return false; 
            }

        }
    }
}
