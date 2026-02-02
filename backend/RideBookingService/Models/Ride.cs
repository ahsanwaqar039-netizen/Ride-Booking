using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RideBookingService.Models
{
    public class Ride
    {
        [Key]
        public int Id { get; set; }

        public int RiderId { get; set; }
        public User? Rider { get; set; }

        public int? DriverId { get; set; }
        public User? Driver { get; set; }

        public double PickupLatitude { get; set; }
        public double PickupLongitude { get; set; }
        public string PickupAddress { get; set; } = string.Empty;

        public double DropoffLatitude { get; set; }
        public double DropoffLongitude { get; set; }
        public string DropoffAddress { get; set; } = string.Empty;

        public decimal OfferedFare { get; set; }
        public decimal? AcceptedFare { get; set; }
        public decimal? SuggestedMinFare { get; set; }
        public decimal? SuggestedMaxFare { get; set; }

        public string Status { get; set; } = "Requested";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }

        public double? DistanceKm { get; set; }

        public string VehicleType { get; set; } = "Car";

        public ICollection<RideOffer> Offers { get; set; } = new List<RideOffer>();
    }
}