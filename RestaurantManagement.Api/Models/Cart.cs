using System.Text.Json.Serialization;

namespace RestaurantManagement.Api.Models;

public class Cart
{
    public int Id { get; set; }
    public int UserId { get; set; }
    [JsonIgnore]
    public User? User { get; set; }
    public int RestaurantId { get; set; }
    [JsonIgnore]
    public Restaurant? Restaurant { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
}
