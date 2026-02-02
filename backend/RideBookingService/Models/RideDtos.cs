using System.ComponentModel.DataAnnotations;

namespace RideBookingService.Models
{
    public class CreateRideDto
    {
        [Required]
        public double PickupLatitude { get; set; }
        [Required]
        public double PickupLongitude { get; set; }
        [Required]
        public string PickupAddress { get; set; } = string.Empty;

        [Required]
        public double DropoffLatitude { get; set; }
        [Required]
        public double DropoffLongitude { get; set; }
        [Required]
        public string DropoffAddress { get; set; } = string.Empty;

        [Required]
        public decimal OfferedFare { get; set; }
        
        public double? DistanceKm { get; set; }
        public string VehicleType { get; set; } = "Car";
    }

    public class MakeOfferDto
    {
        [Required]
        public decimal FareAmount { get; set; }
    }

    public class RideResponseDto
    {
        public int Id { get; set; }
        public int RiderId { get; set; }
        public string RiderName { get; set; } = string.Empty;
        public double PickupLatitude { get; set; }
        public double PickupLongitude { get; set; }
        public string PickupAddress { get; set; } = string.Empty;
        public double DropoffLatitude { get; set; }
        public double DropoffLongitude { get; set; }
        public string DropoffAddress { get; set; } = string.Empty;
        public decimal OfferedFare { get; set; }
        public decimal? SuggestedMinFare { get; set; }
        public decimal? SuggestedMaxFare { get; set; }
        public string Status { get; set; } = string.Empty;
        public double? DistanceKm { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
