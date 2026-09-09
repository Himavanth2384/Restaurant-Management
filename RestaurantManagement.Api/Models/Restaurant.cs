using System.Text.Json.Serialization;

namespace RestaurantManagement.Api.Models;

public class Restaurant
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string OpeningTime { get; set; } = string.Empty;
    public string ClosingTime { get; set; } = string.Empty;
    public int OwnerId { get; set; }
    public User? Owner { get; set; }
    public string Status { get; set; } = "Pending";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ICollection<Category> Categories { get; set; } = new List<Category>();
    [JsonIgnore]
    public ICollection<MenuItem> MenuItems { get; set; } = new List<MenuItem>();
    [JsonIgnore]
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
