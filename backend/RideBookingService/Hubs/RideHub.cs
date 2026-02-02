using Microsoft.AspNetCore.SignalR;
using RideBookingService.Data;
using Microsoft.EntityFrameworkCore;

namespace RideBookingService.Hubs
{
    public class RideHub : Hub
    {
        private readonly AppDbContext _context;

        public RideHub(AppDbContext context)
        {
            _context = context;
        }

        public async Task UpdateLocation(double lat, double lng)
        {
            var userId = Context.User?.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userId)) return;

            var user = await _context.Users.FindAsync(int.Parse(userId));
            if (user != null)
            {
                user.Latitude = lat;
                user.Longitude = lng;
                user.IsOnline = true;
                user.LastActiveAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                await Clients.All.SendAsync("UserLocationUpdated", user.Id, user.Role, lat, lng);
            }
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst("id")?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                var user = await _context.Users.FindAsync(int.Parse(userId));
                if (user != null)
                {
                    user.IsOnline = true;
                    await _context.SaveChangesAsync();
                }
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst("id")?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                var user = await _context.Users.FindAsync(int.Parse(userId));
                if (user != null)
                {
                    user.IsOnline = false;
                    await _context.SaveChangesAsync();
                }
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}
