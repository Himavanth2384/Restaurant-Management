using System.Text.Json.Serialization;

namespace RestaurantManagement.Api.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int RestaurantId { get; set; }
    [JsonIgnore]
    public Restaurant? Restaurant { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ICollection<MenuItem> MenuItems { get; set; } = new List<MenuItem>();
}
