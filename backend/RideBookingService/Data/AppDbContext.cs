using Microsoft.EntityFrameworkCore;
using RideBookingService.Models;

namespace RideBookingService.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Ride> Rides { get; set; }
        public DbSet<RideOffer> RideOffers { get; set; }
        public DbSet<Rating> Ratings { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<Payment> Payments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<Ride>()
                .HasOne(r => r.Rider)
                .WithMany()
                .HasForeignKey(r => r.RiderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Ride>()
                .HasOne(r => r.Driver)
                .WithMany()
                .HasForeignKey(r => r.DriverId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Rating>()
                .HasOne(rt => rt.Ride)
                .WithMany()
                .HasForeignKey(rt => rt.RideId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RideOffer>()
                .HasOne(ro => ro.Ride)
                .WithMany(r => r.Offers)
                .HasForeignKey(ro => ro.RideId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RideOffer>()
                .HasOne(ro => ro.Driver)
                .WithMany()
                .HasForeignKey(ro => ro.DriverId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ChatMessage>()
                .HasOne(m => m.Ride)
                .WithMany()
                .HasForeignKey(m => m.RideId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ChatMessage>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Ride)
                .WithMany()
                .HasForeignKey(p => p.RideId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
