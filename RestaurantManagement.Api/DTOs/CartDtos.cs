namespace RestaurantManagement.Api.DTOs;

public class AddCartItemRequest
{
    public int RestaurantId { get; set; }
    public int MenuItemId { get; set; }
    public int Quantity { get; set; }
}

public class UpdateCartItemRequest
{
    public int Quantity { get; set; }
}
