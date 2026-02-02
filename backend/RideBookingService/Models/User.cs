using System.ComponentModel.DataAnnotations;

namespace RideBookingService.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "Rider"; 

        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        
        public string? VehicleInfo { get; set; }

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public bool IsOnline { get; set; } = false;
        public decimal WalletBalance { get; set; } = 0;
        public DateTime? LastActiveAt { get; set; }
    }

    public class LoginDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "Rider";
    }
}