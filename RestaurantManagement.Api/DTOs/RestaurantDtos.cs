namespace RestaurantManagement.Api.DTOs;

public class UpdateRestaurantVisibilityRequest
{
    public bool IsVisible { get; set; }
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
    public bool? IsActive { get; set; }
}
