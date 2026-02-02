using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace RideBookingService.Models
{
    public class RideOffer
    {
        [Key]
        public int Id { get; set; }

        public int RideId { get; set; }
        [JsonIgnore]
        public Ride? Ride { get; set; }

        public int DriverId { get; set; }
        public User? Driver { get; set; }

        public decimal FareAmount { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string Status { get; set; } = "Pending";
    }
}
