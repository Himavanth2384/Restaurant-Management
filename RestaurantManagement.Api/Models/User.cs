using System.Text.Json.Serialization;

namespace RestaurantManagement.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Role { get; set; } = "User"; // Default role is "User"
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ICollection<Restaurant> Restaurants { get; set; } = new List<Restaurant>();
    [JsonIgnore]
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    [JsonIgnore]
    public ICollection<Cart> Carts { get; set; } = new List<Cart>();
}
