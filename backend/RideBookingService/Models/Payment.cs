using System.ComponentModel.DataAnnotations;

namespace RideBookingService.Models
{
    public class Payment
    {
        [Key]
        public int Id { get; set; }
        public int RideId { get; set; }
        public int RiderId { get; set; }
        public int DriverId { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Completed, Failed
        public string PaymentMethod { get; set; } = "Wallet";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Ride? Ride { get; set; }
        public virtual User? Rider { get; set; }
        public virtual User? Driver { get; set; }
    }

    public class DepositDto
    {
        public decimal Amount { get; set; }
    }
}
