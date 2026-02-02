using System;
using System.ComponentModel.DataAnnotations;

namespace RideBookingService.Models
{
    public class Rating
    {
        [Key]
        public int Id { get; set; }

        public int RideId { get; set; }
        public Ride? Ride { get; set; }

        public int FromUserId { get; set; }
        public int ToUserId { get; set; }

        public int Score { get; set; }
        public string? Comment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
