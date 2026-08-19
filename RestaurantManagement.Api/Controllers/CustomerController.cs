using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Api.Data;
using RestaurantManagement.Api.DTOs;
using RestaurantManagement.Api.Models;
using System.Security.Claims;

namespace RestaurantManagement.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize(Roles = "User")]
public class CustomerController : ControllerBase
{
    private readonly AppDbContext _context;

    public CustomerController(AppDbContext context)
    {
        _context = context;
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet("restaurants")]
    public async Task<IActionResult> GetRestaurants([FromQuery] string? search)
    {
        var query = _context.Restaurants.Where(r => r.Status == "Approved" && r.IsActive).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(r => r.Name.Contains(search) || r.Description.Contains(search));
        var restaurants = await query.OrderBy(r => r.Name).ToListAsync();
        return Ok(restaurants);
    }

    [HttpGet("restaurants/{id}")]
    public async Task<IActionResult> GetRestaurant(int id)
    {
        var restaurant = await _context.Restaurants.Include(r => r.MenuItems).ThenInclude(m => m.Category).FirstOrDefaultAsync(r => r.Id == id && r.Status == "Approved" && r.IsActive);
        return restaurant == null ? NotFound() : Ok(restaurant);
    }

    [HttpGet("menu/search")]
    public async Task<IActionResult> SearchMenu([FromQuery] string? search, [FromQuery] string? foodType)
    {
        var query = _context.MenuItems.Include(m => m.Restaurant).Where(m => m.IsAvailable).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(m => m.Name.Contains(search) || m.Restaurant!.Name.Contains(search));
        if (!string.IsNullOrWhiteSpace(foodType) && foodType != "All") query = query.Where(m => m.FoodType == foodType);
        var items = await query.OrderBy(m => m.Name).ToListAsync();
        return Ok(items);
    }

    [HttpGet("cart")]
    public async Task<IActionResult> GetCart()
    {
        var userId = GetUserId();
        var cart = await _context.Carts.Include(c => c.CartItems).ThenInclude(ci => ci.MenuItem).FirstOrDefaultAsync(c => c.UserId == userId);
        return cart == null ? Ok(new { items = new List<CartItem>() }) : Ok(cart);
    }

    [HttpPost("cart")]
    public async Task<IActionResult> AddCartItem([FromBody] AddCartItemRequest request)
    {
        var userId = GetUserId();
        var menuItem = await _context.MenuItems.Include(m => m.Restaurant).FirstOrDefaultAsync(m => m.Id == request.MenuItemId && m.IsAvailable);
        if (menuItem == null) return NotFound();

        var existingCart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId);
        if (existingCart == null)
        {
            existingCart = new Cart { UserId = userId, RestaurantId = request.RestaurantId };
            _context.Carts.Add(existingCart);
            await _context.SaveChangesAsync();
        }
        else if (existingCart.RestaurantId != request.RestaurantId)
        {
            return BadRequest(new { message = "Your cart contains items from another restaurant. Clear the cart first." });
        }

        var existingItem = await _context.CartItems.FirstOrDefaultAsync(ci => ci.CartId == existingCart.Id && ci.MenuItemId == request.MenuItemId);
        if (existingItem == null)
        {
            _context.CartItems.Add(new CartItem { CartId = existingCart.Id, MenuItemId = request.MenuItemId, Quantity = request.Quantity, Price = menuItem.Price });
        }
        else
        {
            existingItem.Quantity += request.Quantity;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Item added to cart." });
    }

    [HttpDelete("cart/{id}")]
    public async Task<IActionResult> RemoveCartItem(int id)
    {
        var userId = GetUserId();
        var cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId);
        if (cart == null) return NotFound();
        var item = await _context.CartItems.FirstOrDefaultAsync(ci => ci.Id == id && ci.CartId == cart.Id);
        if (item == null) return NotFound();
        _context.CartItems.Remove(item);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Item removed from cart." });
    }

    [HttpPost("orders")]
    public async Task<IActionResult> PlaceOrder([FromBody] CreateOrderRequest request)
    {
        var userId = GetUserId();
        var cart = await _context.Carts.Include(c => c.CartItems).ThenInclude(ci => ci.MenuItem).FirstOrDefaultAsync(c => c.UserId == userId);
        if (cart == null || !cart.CartItems.Any()) return BadRequest(new { message = "Cart is empty." });

        var restaurantId = cart.RestaurantId;
        var restaurant = await _context.Restaurants.FindAsync(restaurantId);
        if (restaurant == null || restaurant.Status != "Approved" || !restaurant.IsActive) return BadRequest(new { message = "Restaurant is not available for ordering." });

        var total = cart.CartItems.Sum(i => i.Quantity * i.Price);
        var order = new Order
        {
            UserId = userId,
            RestaurantId = restaurantId,
            TotalAmount = total,
            DeliveryAddress = request.DeliveryAddress,
            Status = "Placed"
        };
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        foreach (var item in cart.CartItems)
        {
            _context.OrderItems.Add(new OrderItem
            {
                OrderId = order.Id,
                MenuItemId = item.MenuItemId,
                FoodName = item.MenuItem!.Name,
                Quantity = item.Quantity,
                Price = item.Price,
                Subtotal = item.Quantity * item.Price
            });
        }

        _context.Payments.Add(new Payment
        {
            OrderId = order.Id,
            Amount = total,
            PaymentMethod = request.PaymentMethod,
            Status = "Pending"
        });
        _context.CartItems.RemoveRange(cart.CartItems);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Order placed successfully.", orderId = order.Id });
    }

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders()
    {
        var userId = GetUserId();
        var orders = await _context.Orders.Where(o => o.UserId == userId).Include(o => o.Restaurant).OrderByDescending(o => o.CreatedAt).ToListAsync();
        return Ok(orders);
    }

    [HttpGet("orders/{id}")]
    public async Task<IActionResult> GetOrderDetail(int id)
    {
        var userId = GetUserId();
        var order = await _context.Orders.Include(o => o.OrderItems).Include(o => o.Payments).FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId);
        return order == null ? NotFound() : Ok(order);
    }
}
