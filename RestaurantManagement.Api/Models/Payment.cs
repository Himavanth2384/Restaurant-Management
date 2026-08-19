namespace RestaurantManagement.Api.Models;

public class Payment
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order? Order { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Cash on Delivery";
    public string Status { get; set; } = "Pending";
    public string? TransactionReference { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
