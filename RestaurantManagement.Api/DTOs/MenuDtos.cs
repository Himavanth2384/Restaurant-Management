namespace RestaurantManagement.Api.DTOs;

public class CreateMenuItemRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string FoodType { get; set; } = "Veg";
    public bool IsAvailable { get; set; } = true;
    public int CategoryId { get; set; }
}

public class UpdateMenuItemRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public string? FoodType { get; set; }
    public bool? IsAvailable { get; set; }
    public int? CategoryId { get; set; }
}
