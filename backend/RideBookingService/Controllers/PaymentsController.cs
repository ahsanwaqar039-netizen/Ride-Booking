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
    public class PaymentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentsController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() => int.Parse(User.FindFirst("id")?.Value ?? "0");

        [HttpGet("balance")]
        public async Task<ActionResult<decimal>> GetBalance()
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();
            return Ok(user.WalletBalance);
        }

        [HttpPost("deposit")]
        public async Task<ActionResult> Deposit(DepositDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            user.WalletBalance += dto.Amount;
            await _context.SaveChangesAsync();

            return Ok(new { balance = user.WalletBalance });
        }

        [HttpPost("withdraw")]
        public async Task<ActionResult> Withdraw(DepositDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            if (user.WalletBalance < dto.Amount)
                return BadRequest("Insufficient balance for withdrawal");

            user.WalletBalance -= dto.Amount;
            await _context.SaveChangesAsync();

            return Ok(new { balance = user.WalletBalance });
        }

        [HttpPost("transfer-for-ride/{rideId}")]
        public async Task<ActionResult> ProcessRidePayment(int rideId)
        {
            var userId = GetUserId();
            var ride = await _context.Rides.FindAsync(rideId);

            if (ride == null) return NotFound("Ride not found");
            if (ride.Status != "Completed") return BadRequest("Ride must be completed before payment");
            if (ride.RiderId != userId) return Forbid();

            var existingPayment = await _context.Payments.FirstOrDefaultAsync(p => p.RideId == rideId && p.Status == "Completed");
            if (existingPayment != null) return BadRequest("Ride already paid for");

            var fare = (decimal)(ride.AcceptedFare ?? ride.OfferedFare);
            var rider = await _context.Users.FindAsync(ride.RiderId);
            var driver = await _context.Users.FindAsync(ride.DriverId);

            if (rider == null || driver == null) return NotFound("Users not found");
            if (rider.WalletBalance < fare) return BadRequest("Insufficient wallet balance");

            // Transactional update
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                rider.WalletBalance -= fare;
                driver.WalletBalance += fare;

                var payment = new Payment
                {
                    RideId = rideId,
                    RiderId = rider.Id,
                    DriverId = driver.Id,
                    Amount = fare,
                    Status = "Completed",
                    PaymentMethod = "Wallet"
                };

                _context.Payments.Add(payment);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Payment successful", balance = rider.WalletBalance });
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "Payment processing failed");
            }
        }
    }
}
