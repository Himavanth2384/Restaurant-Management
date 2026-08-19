namespace RestaurantManagement.Api.DTOs;

public class CreateOrderRequest
{
    public string DeliveryAddress { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = "Cash on Delivery";
}

public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

public class PaymentRequest
{
    public string PaymentMethod { get; set; } = "Cash on Delivery";
    public string Status { get; set; } = "Pending";
}
