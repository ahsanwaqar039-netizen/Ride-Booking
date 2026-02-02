using System.ComponentModel.DataAnnotations;

namespace RideBookingService.Models
{
    public class ChatMessage
    {
        [Key]
        public int Id { get; set; }
        public int RideId { get; set; }
        public int SenderId { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Ride? Ride { get; set; }
        public virtual User? Sender { get; set; }
    }

    public class SendMessageDto
    {
        public int RideId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}
