using System.Text.Json.Serialization;

namespace RestaurantManagement.Api.Models;

public class MenuItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string FoodType { get; set; } = "Veg";
    public string? ImageUrl { get; set; }
    public bool IsAvailable { get; set; } = true;
    public int CategoryId { get; set; }
    [JsonIgnore]
    public Category? Category { get; set; }
    public int RestaurantId { get; set; }
    [JsonIgnore]
    public Restaurant? Restaurant { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
    [JsonIgnore]
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
