using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RideBookingService.Data;
using RideBookingService.Models;
using System.Security.Claims;

namespace RideBookingService.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RatingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RatingsController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() => int.Parse(User.FindFirst("id")?.Value ?? "0");

        [HttpPost]
        public async Task<ActionResult> RateRide(RateRideDto dto)
        {
            var userId = GetUserId();
            var ride = await _context.Rides.FindAsync(dto.RideId);

            if (ride == null) return NotFound("Ride not found");
            if (ride.Status != "Completed" && ride.Status != "Accepted") 
                return BadRequest("Cannot rate this ride yet");

            if (ride.RiderId != userId && ride.DriverId != userId)
                return Forbid();

            var fromRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "Rider";
            var toUserId = fromRole == "Rider" ? ride.DriverId : ride.RiderId;

            if (toUserId == null) return BadRequest("No person to rate");

            var rating = new Rating
            {
                RideId = dto.RideId,
                FromUserId = userId,
                ToUserId = toUserId.Value,
                Score = dto.Score,
                Comment = dto.Comment
            };

            _context.Ratings.Add(rating);
            await _context.SaveChangesAsync();

            return Ok(rating);
        }

        [HttpGet("user/{userId}")]
        [AllowAnonymous]
        public async Task<ActionResult<object>> GetUserRating(int userId)
        {
            var ratings = await _context.Ratings.Where(r => r.ToUserId == userId).ToListAsync();
            if (!ratings.Any()) return Ok(new { averageScore = 0, count = 0 });

            var average = ratings.Average(r => r.Score);
            return Ok(new { averageScore = average, count = ratings.Count, reviews = ratings });
        }
    }

    public class RateRideDto
    {
        public int RideId { get; set; }
        public int Score { get; set; }
        public string? Comment { get; set; }
    }
}
