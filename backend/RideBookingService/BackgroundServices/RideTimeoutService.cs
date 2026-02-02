using Microsoft.AspNetCore.SignalR;
using RideBookingService.Hubs;
using RideBookingService.Data;
using Microsoft.EntityFrameworkCore;

namespace RideBookingService.BackgroundServices
{
    public class RideTimeoutService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<RideTimeoutService> _logger;
        private readonly IHubContext<RideHub> _hubContext;

        public RideTimeoutService(IServiceProvider serviceProvider, ILogger<RideTimeoutService> logger, IHubContext<RideHub> hubContext)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _hubContext = hubContext;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckForTimedOutRides();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while checking for timed out rides");
                }

                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }

        private async Task CheckForTimedOutRides()
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var timeoutThreshold = DateTime.UtcNow.AddMinutes(-5);
                
                var timedOutRides = await context.Rides
                    .Where(r => r.Status == "Requested" && r.CreatedAt < timeoutThreshold)
                    .ToListAsync();

                if (timedOutRides.Any())
                {
                    foreach (var ride in timedOutRides)
                    {
                        ride.Status = "Cancelled";
                        _logger.LogInformation($"Auto-cancelling ride {ride.Id} due to timeout.");
                        
                        await _hubContext.Clients.User(ride.RiderId.ToString())
                            .SendAsync("RideCancelled", ride.Id, "Ride request timed out after 5 minutes.");
                    }

                    await context.SaveChangesAsync();
                }
            }
        }
    }
}
