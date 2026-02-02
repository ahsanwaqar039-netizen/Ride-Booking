using System.Net.Http.Json;

namespace RideBookingService.Services
{
    public interface IAiService
    {
        Task<SuggestedFareResponse?> GetSuggestedFareAsync(double distanceKm, string vehicleType = "Car", double trafficFactor = 1.0);
    }

    public class AiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public AiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<SuggestedFareResponse?> GetSuggestedFareAsync(double distanceKm, string vehicleType = "Car", double trafficFactor = 1.0)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("suggest-fare", new { distance_km = distanceKm, vehicle_type = vehicleType, traffic_factor = trafficFactor });
                if (response.IsSuccessStatusCode)
                {
                    return await response.Content.ReadFromJsonAsync<SuggestedFareResponse>();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error calling AI service: {ex.Message}");
            }
            return null;
        }
    }

    public class SuggestedFareResponse
    {
        public decimal MinFare { get; set; }
        public decimal MaxFare { get; set; }
        public decimal SuggestedFare { get; set; }
    }
}
