using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RideBookingService.Data;
using RideBookingService.Models;

namespace RideBookingService.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ChatController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() => int.Parse(User.FindFirst("id")?.Value ?? "0");

        [HttpGet("history/{rideId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetChatHistory(int rideId)
        {
            var userId = GetUserId();
            var ride = await _context.Rides.FindAsync(rideId);

            if (ride == null) return NotFound("Ride not found");
            if (ride.RiderId != userId && ride.DriverId != userId) return Forbid();

            var messages = await _context.ChatMessages
                .Where(m => m.RideId == rideId)
                .Include(m => m.Sender)
                .OrderBy(m => m.SentAt)
                .Select(m => new
                {
                    id = m.Id,
                    rideId = m.RideId,
                    senderId = m.SenderId,
                    senderName = m.Sender != null ? m.Sender.Username : "User",
                    content = m.Content,
                    sentAt = m.SentAt
                })
                .ToListAsync();

            return Ok(messages);
        }
    }
}
