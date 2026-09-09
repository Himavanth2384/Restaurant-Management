using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Api.Data;
using RestaurantManagement.Api.DTOs;
using RestaurantManagement.Api.Helpers;
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
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var user = await _context.Users.FindAsync(GetUserId());
        return user == null ? NotFound() : Ok(new { user.Id, user.Name, user.Email, user.Phone, user.Address });
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileRequest request)
    {
        var userId = GetUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();
        if (string.IsNullOrWhiteSpace(request.Email)) return BadRequest(new { message = "Email is required." });
        if (await _context.Users.AnyAsync(item => item.Email == request.Email && item.Id != userId)) return BadRequest(new { message = "Email is already in use." });

        user.Name = request.Name;
        user.Email = request.Email;
        user.Phone = request.Phone;
        user.Address = request.Address;
        if (!string.IsNullOrWhiteSpace(request.Password)) user.PasswordHash = PasswordHelper.HashPassword(request.Password);
        await _context.SaveChangesAsync();
        return Ok(new { user.Id, user.Name, user.Email, user.Phone, user.Address });
    }

    [HttpGet("restaurants")]
    public async Task<IActionResult> GetRestaurants([FromQuery] string? search)
    {
        var query = _context.Restaurants.Where(r => r.IsActive).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(r => r.Name.Contains(search) || r.Description.Contains(search));
        var restaurants = await query.OrderBy(r => r.Name).ToListAsync();
        return Ok(restaurants);
    }

    [HttpGet("restaurants/{id}")]
    public async Task<IActionResult> GetRestaurant(int id)
    {
        var restaurant = await _context.Restaurants
            .Where(r => r.Id == id && r.IsActive)
            .Select(r => new
            {
                r.Id, r.Name, r.Description, r.Address, r.Phone, r.Email,
                r.OpeningTime, r.ClosingTime, r.OwnerId, r.Status, r.IsActive, r.CreatedAt,
                menuItems = r.MenuItems.Select(m => new
                {
                    m.Id, m.Name, m.Description, m.Price, m.FoodType,
                    m.IsAvailable, m.CategoryId, m.RestaurantId
                }).ToList()
            })
            .FirstOrDefaultAsync();
        return restaurant == null ? NotFound() : Ok(restaurant);
    }

    [HttpGet("menu/search")]
    public async Task<IActionResult> SearchMenu([FromQuery] string? search, [FromQuery] string? foodType)
    {
        var query = _context.MenuItems.Include(m => m.Restaurant).Where(m => m.IsAvailable && m.Restaurant != null && m.Restaurant.IsActive).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(m => m.Name.Contains(search) || m.Restaurant!.Name.Contains(search));
        if (!string.IsNullOrWhiteSpace(foodType) && foodType != "All") query = query.Where(m => m.FoodType == foodType);
        var items = await query.OrderBy(m => m.Name).ToListAsync();
        return Ok(items);
    }

    [HttpGet("cart")]
    public async Task<IActionResult> GetCart()
    {
        var userId = GetUserId();
        var cart = await _context.Carts
            .Where(c => c.UserId == userId)
            .Select(c => new
            {
                c.Id, c.UserId, c.RestaurantId, c.CreatedAt,
                items = c.CartItems.Select(ci => new
                {
                    ci.Id, ci.CartId, ci.MenuItemId, ci.Quantity, ci.Price,
                    menuItem = new { ci.MenuItem!.Id, ci.MenuItem.Name, ci.MenuItem.IsAvailable }
                }).ToList()
            })
            .FirstOrDefaultAsync();
        return cart == null ? Ok(new { items = Array.Empty<object>() }) : Ok(cart);
    }

    [HttpPost("cart")]
    public async Task<IActionResult> AddCartItem([FromBody] AddCartItemRequest request)
    {
        var userId = GetUserId();
        var menuItem = await _context.MenuItems.Include(m => m.Restaurant).FirstOrDefaultAsync(m => m.Id == request.MenuItemId && m.IsAvailable && m.RestaurantId == request.RestaurantId && m.Restaurant!.IsActive);
        if (menuItem == null) return NotFound();
        if (request.Quantity < 1) return BadRequest(new { message = "Quantity must be at least 1." });

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

    [HttpPut("cart/{id}")]
    public async Task<IActionResult> UpdateCartItem(int id, [FromBody] UpdateCartItemRequest request)
    {
        var userId = GetUserId();
        var item = await _context.CartItems.Include(i => i.Cart).FirstOrDefaultAsync(i => i.Id == id && i.Cart!.UserId == userId);
        if (item == null) return NotFound();
        if (request.Quantity < 1) return BadRequest(new { message = "Quantity must be at least 1." });
        item.Quantity = request.Quantity;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Cart updated." });
    }

    [HttpPost("orders")]
    public async Task<IActionResult> PlaceOrder([FromBody] CreateOrderRequest request)
    {
        var userId = GetUserId();
        var cart = await _context.Carts.Include(c => c.CartItems).ThenInclude(ci => ci.MenuItem).FirstOrDefaultAsync(c => c.UserId == userId);
        if (cart == null || !cart.CartItems.Any()) return BadRequest(new { message = "Cart is empty." });

        var restaurantId = cart.RestaurantId;
        var restaurant = await _context.Restaurants.FindAsync(restaurantId);
        if (restaurant == null || !restaurant.IsActive) return BadRequest(new { message = "Restaurant is not available for ordering." });

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
        var orders = await _context.Orders.Where(o => o.UserId == userId).OrderByDescending(o => o.Id).Select(o => new
        {
            o.Id, o.TotalAmount, o.DeliveryAddress, o.Status, o.CreatedAt,
            restaurant = new { o.Restaurant!.Id, o.Restaurant.Name },
            payment = o.Payments.OrderByDescending(item => item.CreatedAt).Select(item => new { item.PaymentMethod }).FirstOrDefault()
        }).ToListAsync();
        return Ok(orders);
    }

    [HttpGet("orders/{id}")]
    public async Task<IActionResult> GetOrderDetail(int id)
    {
        var userId = GetUserId();
        var order = await _context.Orders.Where(o => o.Id == id && o.UserId == userId).Select(o => new
        {
            o.Id, o.TotalAmount, o.DeliveryAddress, o.Status, o.CreatedAt,
            restaurant = new { o.Restaurant!.Id, o.Restaurant.Name },
            payment = o.Payments.OrderByDescending(item => item.CreatedAt).Select(item => new { item.PaymentMethod }).FirstOrDefault(),
            items = o.OrderItems.Select(item => new { item.Id, item.FoodName, item.Quantity, item.Price, item.Subtotal }).ToList()
        }).FirstOrDefaultAsync();
        return order == null ? NotFound() : Ok(order);
    }
}
