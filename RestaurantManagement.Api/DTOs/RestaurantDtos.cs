namespace RestaurantManagement.Api.DTOs;

public class CreateRestaurantRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string OpeningTime { get; set; } = string.Empty;
    public string ClosingTime { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}

public class UpdateRestaurantRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? OpeningTime { get; set; }
    public string? ClosingTime { get; set; }
    public string? ImageUrl { get; set; }
    public bool? IsActive { get; set; }
}
