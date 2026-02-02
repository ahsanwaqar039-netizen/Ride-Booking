using Microsoft.AspNetCore.SignalR;
using RideBookingService.Data;
using RideBookingService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace RideBookingService.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly AppDbContext _context;

        public ChatHub(AppDbContext context)
        {
            _context = context;
        }

        public async Task JoinRideChat(int rideId)
        {
            var userIdStr = Context.User?.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return;
            if (!int.TryParse(userIdStr, out int userId)) return;

            var ride = await _context.Rides.FindAsync(rideId);
            if (ride == null || (ride.RiderId != userId && ride.DriverId != userId)) return;

            await Groups.AddToGroupAsync(Context.ConnectionId, $"RideChat_{rideId}");
        }

        public async Task LeaveRideChat(int rideId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"RideChat_{rideId}");
        }

        public async Task SendMessage(int rideId, string content)
        {
            var userIdStr = Context.User?.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return;

            if (!int.TryParse(userIdStr, out int userId)) return;

            var ride = await _context.Rides.FindAsync(rideId);
            
            if (ride == null) return;
            if (ride.RiderId != userId && ride.DriverId != userId) return;

            var message = new ChatMessage
            {
                RideId = rideId,
                SenderId = userId,
                Content = content,
                SentAt = DateTime.UtcNow
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            await Clients.Group($"RideChat_{rideId}").SendAsync("ReceiveMessage", new {
                id = message.Id,
                rideId = message.RideId,
                senderId = message.SenderId,
                content = message.Content,
                sentAt = message.SentAt,
                senderName = Context.User?.Identity?.Name ?? "User"
            });
        }
    }
}
