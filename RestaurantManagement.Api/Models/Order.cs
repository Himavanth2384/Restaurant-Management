using System.Text.Json.Serialization;

namespace RestaurantManagement.Api.Models;

public class Order
{
    public int Id { get; set; }
    public int UserId { get; set; }
    [JsonIgnore]
    public User? User { get; set; }
    public int RestaurantId { get; set; }
    [JsonIgnore]
    public Restaurant? Restaurant { get; set; }
    public decimal TotalAmount { get; set; }
    public string DeliveryAddress { get; set; } = string.Empty;
    public string Status { get; set; } = "Placed";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    [JsonIgnore]
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
