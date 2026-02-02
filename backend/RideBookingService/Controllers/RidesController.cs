using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RideBookingService.Data;
using RideBookingService.Models;
using RideBookingService.Services;
using System.Security.Claims;

namespace RideBookingService.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RidesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAiService _aiService;

        public RidesController(AppDbContext context, IAiService aiService)
        {
            _context = context;
            _aiService = aiService;
        }

        private int GetUserId() => int.Parse(User.FindFirst("id")?.Value ?? "0");

        [HttpGet("fare-suggestion")]
        public async Task<ActionResult<SuggestedFareResponse>> GetFareSuggestion([FromQuery] double distanceKm, [FromQuery] string vehicleType = "Car")
        {
            var suggestions = await _aiService.GetSuggestedFareAsync(distanceKm, vehicleType);
            if (suggestions == null) return BadRequest("Could not calculate fare");
            return Ok(suggestions);
        }

        [HttpPost]
        [Authorize(Roles = "Rider")]
        public async Task<ActionResult<Ride>> CreateRide(CreateRideDto dto)
        {
            var riderId = GetUserId();

            SuggestedFareResponse? aiSuggestions = null;
            if (dto.DistanceKm.HasValue)
            {
                aiSuggestions = await _aiService.GetSuggestedFareAsync(dto.DistanceKm.Value, dto.VehicleType ?? "Car");
            }

            var ride = new Ride
            {
                RiderId = riderId,
                PickupLatitude = dto.PickupLatitude,
                PickupLongitude = dto.PickupLongitude,
                PickupAddress = dto.PickupAddress,
                DropoffLatitude = dto.DropoffLatitude,
                DropoffLongitude = dto.DropoffLongitude,
                DropoffAddress = dto.DropoffAddress,
                OfferedFare = dto.OfferedFare,
                DistanceKm = dto.DistanceKm,
                SuggestedMinFare = aiSuggestions?.MinFare,
                SuggestedMaxFare = aiSuggestions?.MaxFare,
                VehicleType = dto.VehicleType ?? "Car",
                Status = "Requested"
            };

            _context.Rides.Add(ride);
            await _context.SaveChangesAsync();

            return Ok(ride);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Ride>> GetRide(int id)
        {
            var ride = await _context.Rides.FindAsync(id);
            if (ride == null) return NotFound();
            return Ok(ride);
        }

        [HttpGet("available")]
        [Authorize(Roles = "Driver")]
        public async Task<ActionResult<IEnumerable<Ride>>> GetAvailableRides()
        {
            var rides = await _context.Rides
                .Where(r => r.Status == "Requested")
                .Include(r => r.Rider)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(rides);
        }

        [HttpPost("{id}/offer")]
        [Authorize(Roles = "Driver")]
        public async Task<ActionResult> MakeOffer(int id, MakeOfferDto dto)
        {
            var driverId = GetUserId();
            var ride = await _context.Rides.FindAsync(id);

            if (ride == null) return NotFound("Ride not found");
            if (ride.Status != "Requested") return BadRequest("Ride is no longer available");

            var offer = new RideOffer
            {
                RideId = id,
                DriverId = driverId,
                FareAmount = dto.FareAmount,
                Status = "Pending"
            };

            _context.RideOffers.Add(offer);
            await _context.SaveChangesAsync();

            return Ok(offer);
        }

        [HttpGet("{id}/offers")]
        [Authorize(Roles = "Rider")]
        public async Task<ActionResult<IEnumerable<RideOffer>>> GetOffers(int id)
        {
            var riderId = GetUserId();
            var ride = await _context.Rides.FindAsync(id);

            if (ride == null) return NotFound();
            if (ride.RiderId != riderId) return Forbid();

            var offers = await _context.RideOffers
                .Where(o => o.RideId == id)
                .Include(o => o.Driver)
                .ToListAsync();

            return Ok(offers);
        }

        [HttpPost("{id}/offers/{offerId}/accept")]
        [Authorize(Roles = "Rider")]
        public async Task<ActionResult> AcceptOffer(int id, int offerId)
        {
            var riderId = GetUserId();
            var ride = await _context.Rides.Include(r => r.Offers).FirstOrDefaultAsync(r => r.Id == id);

            if (ride == null) return NotFound("Ride not found");
            if (ride.RiderId != riderId) return Forbid();
            
            var acceptedOffer = ride.Offers.FirstOrDefault(o => o.Id == offerId);
            if (acceptedOffer == null) return NotFound("Offer not found");

            ride.Status = "Accepted";
            ride.DriverId = acceptedOffer.DriverId;
            ride.AcceptedFare = acceptedOffer.FareAmount;
            ride.StartedAt = DateTime.UtcNow;

            acceptedOffer.Status = "Accepted";

            foreach (var offer in ride.Offers.Where(o => o.Id != offerId))
            {
                offer.Status = "Rejected";
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Offer accepted", rideId = ride.Id, driverId = ride.DriverId });
        }

        [HttpGet("my-rides")]
        public async Task<ActionResult<IEnumerable<Ride>>> GetMyRides()
        {
            var userId = GetUserId();
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            IQueryable<Ride> query = _context.Rides;

            if (role == "Rider")
            {
                query = query.Where(r => r.RiderId == userId);
            }
            else if (role == "Driver")
            {
                query = query.Where(r => r.DriverId == userId);
            }

            var rides = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
            return Ok(rides);
        }

        [HttpPost("{id}/complete")]
        [Authorize(Roles = "Driver")]
        public async Task<ActionResult> CompleteRide(int id)
        {
            var driverId = GetUserId();
            var ride = await _context.Rides.FindAsync(id);

            if (ride == null) return NotFound("Ride not found");
            if (ride.DriverId != driverId) return Forbid();
            if (ride.Status != "Accepted") return BadRequest("Ride cannot be completed from this state");

            ride.Status = "Completed";
            ride.CompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Ride completed" });
        }

        [HttpGet("earnings")]
        [Authorize(Roles = "Driver")]
        public async Task<ActionResult> GetEarnings()
        {
            var driverId = GetUserId();
            var today = DateTime.UtcNow.Date;

            var todayEarnings = await _context.Rides
                .Where(r => r.DriverId == driverId && r.Status == "Completed" && r.CompletedAt >= today && r.AcceptedFare.HasValue)
                .SumAsync(r => r.AcceptedFare!.Value);

            var totalEarnings = await _context.Rides
                .Where(r => r.DriverId == driverId && r.Status == "Completed" && r.AcceptedFare.HasValue)
                .SumAsync(r => r.AcceptedFare!.Value);

            var completedRidesToday = await _context.Rides
                .CountAsync(r => r.DriverId == driverId && r.Status == "Completed" && r.CompletedAt >= today);

            return Ok(new
            {
                today = todayEarnings,
                total = totalEarnings,
                completedToday = completedRidesToday
            });
        }
    }
}
