using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RideBookingService.Data;

namespace RideBookingService.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<ActionResult> GetStats()
        {
            var totalUsers = await _context.Users.CountAsync();
            var totalRiders = await _context.Users.CountAsync(u => u.Role == "Rider");
            var totalDrivers = await _context.Users.CountAsync(u => u.Role == "Driver");
            
            var totalRides = await _context.Rides.CountAsync();
            var completedRides = await _context.Rides.CountAsync(r => r.Status == "Completed");
            var activeRides = await _context.Rides.CountAsync(r => r.Status == "Accepted" || r.Status == "InProgress");

            var totalRevenue = await _context.Rides
                .Where(r => r.Status == "Completed" && r.AcceptedFare.HasValue)
                .SumAsync(r => r.AcceptedFare!.Value);

            return Ok(new
            {
                users = new { total = totalUsers, riders = totalRiders, drivers = totalDrivers },
                rides = new { total = totalRides, completed = completedRides, active = activeRides },
                finance = new { revenue = totalRevenue }
            });
        }

        [HttpGet("recent-rides")]
        public async Task<ActionResult> GetRecentRides()
        {
            var rides = await _context.Rides
                .Include(r => r.Rider)
                .Include(r => r.Driver)
                .OrderByDescending(r => r.CreatedAt)
                .Take(20)
                .ToListAsync();

            return Ok(rides);
        }
    }
}
