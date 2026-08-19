using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Api.Data;
using RestaurantManagement.Api.DTOs;
using RestaurantManagement.Api.Models;
using System.Security.Claims;

namespace RestaurantManagement.Api.Controllers;

[ApiController]
[Route("api/owner")]
[Authorize(Roles = "RestaurantOwner")]
public class OwnerController : ControllerBase
{
    private readonly AppDbContext _context;

    public OwnerController(AppDbContext context)
    {
        _context = context;
    }

    private int GetOwnerId() => int.Parse(User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier) ?? "0");

    private async Task<Restaurant?> GetOwnedRestaurantAsync(int? restaurantId = null)
    {
        var ownerId = GetOwnerId();
        var query = _context.Restaurants.Where(r => r.OwnerId == ownerId);
        if (restaurantId.HasValue) query = query.Where(r => r.Id == restaurantId.Value);
        return await query.FirstOrDefaultAsync();
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var restaurant = await GetOwnedRestaurantAsync();
        if (restaurant == null) return NotFound();

        var orders = await _context.Orders.Where(o => o.RestaurantId == restaurant.Id).ToListAsync();
        var today = DateTime.UtcNow.Date;
        return Ok(new
        {
            restaurantName = restaurant.Name,
            todaysOrders = orders.Count(o => o.CreatedAt.Date == today),
            pendingOrders = orders.Count(o => o.Status == "Placed" || o.Status == "Accepted"),
            completedOrders = orders.Count(o => o.Status == "Completed"),
            todaysSales = orders.Where(o => o.CreatedAt.Date == today).Sum(o => o.TotalAmount),
            totalMenuItems = await _context.MenuItems.CountAsync(m => m.RestaurantId == restaurant.Id)
        });
    }

    [HttpGet("restaurant")]
    public async Task<IActionResult> GetRestaurant()
    {
        var restaurant = await GetOwnedRestaurantAsync();
        return restaurant == null ? NotFound() : Ok(restaurant);
    }

    [HttpPut("restaurant")]
    public async Task<IActionResult> UpdateRestaurant([FromBody] UpdateRestaurantRequest request)
    {
        var restaurant = await GetOwnedRestaurantAsync();
        if (restaurant == null) return NotFound();

        if (request.Name != null) restaurant.Name = request.Name;
        if (request.Description != null) restaurant.Description = request.Description;
        if (request.Address != null) restaurant.Address = request.Address;
        if (request.Phone != null) restaurant.Phone = request.Phone;
        if (request.Email != null) restaurant.Email = request.Email;
        if (request.OpeningTime != null) restaurant.OpeningTime = request.OpeningTime;
        if (request.ClosingTime != null) restaurant.ClosingTime = request.ClosingTime;
        if (request.ImageUrl != null) restaurant.ImageUrl = request.ImageUrl;
        if (request.IsActive != null) restaurant.IsActive = request.IsActive.Value;

        await _context.SaveChangesAsync();
        return Ok(restaurant);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var restaurant = await GetOwnedRestaurantAsync();
        if (restaurant == null) return NotFound();
        var categories = await _context.Categories.Where(c => c.RestaurantId == restaurant.Id).OrderBy(c => c.Name).ToListAsync();
        return Ok(categories);
    }

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
    {
        var restaurant = await GetOwnedRestaurantAsync();
        if (restaurant == null) return NotFound();
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest(new { message = "Category name is required." });

        var category = new Category { Name = request.Name, RestaurantId = restaurant.Id };
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetCategories), new { id = category.Id }, category);
    }

    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var restaurant = await GetOwnedRestaurantAsync();
        if (restaurant == null) return NotFound();
        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == id && c.RestaurantId == restaurant.Id);
        if (category == null) return NotFound();
        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Category deleted." });
    }

    [HttpGet("menu")]
    public async Task<IActionResult> GetMenu()
    {
        var restaurant = await GetOwnedRestaurantAsync();
        if (restaurant == null) return NotFound();
        var items = await _context.MenuItems.Include(m => m.Category).Where(m => m.RestaurantId == restaurant.Id).OrderBy(m => m.Name).ToListAsync();
        return Ok(items);
    }

    [HttpPost("menu")]
    public async Task<IActionResult> CreateMenuItem([FromBody] CreateMenuItemRequest request)
    {
        var restaurant = await GetOwnedRestaurantAsync();
        if (restaurant == null) return NotFound();
        if (string.IsNullOrWhiteSpace(request.Name) || request.Price <= 0) return BadRequest(new { message = "Valid food name and price are required." });

        var item = new MenuItem
        {
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            FoodType = request.FoodType,
            ImageUrl = request.ImageUrl,
            IsAvailable = request.IsAvailable,
            CategoryId = request.CategoryId,
            RestaurantId = restaurant.Id
        };

        _context.MenuItems.Add(item);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetMenu), new { id = item.Id }, item);
    }

    [HttpPut("menu/{id}")]
    public async Task<IActionResult> UpdateMenuItem(int id, [FromBody] UpdateMenuItemRequest request)
    {
        var restaurant = await GetOwnedRestaurantAsync();
        if (restaurant == null) return NotFound();
        var item = await _context.MenuItems.FirstOrDefaultAsync(m => m.Id == id && m.RestaurantId == restaurant.Id);
        if (item == null) return NotFound();

        if (request.Name != null) item.Name = request.Name;
        if (request.Description != null) item.Description = request.Description;
        if (request.Price.HasValue) item.Price = request.Price.Value;
        if (request.FoodType != null) item.FoodType = request.FoodType;
        if (request.ImageUrl != null) item.ImageUrl = request.ImageUrl;
        if (request.IsAvailable.HasValue) item.IsAvailable = request.IsAvailable.Value;
        if (request.CategoryId.HasValue) item.CategoryId = request.CategoryId.Value;

        await _context.SaveChangesAsync();
        return Ok(item);
    }

    [HttpDelete("menu/{id}")]
    public async Task<IActionResult> DeleteMenuItem(int id)
    {
        var restaurant = await GetOwnedRestaurantAsync();
        if (restaurant == null) return NotFound();
        var item = await _context.MenuItems.FirstOrDefaultAsync(m => m.Id == id && m.RestaurantId == restaurant.Id);
        if (item == null) return NotFound();
        _context.MenuItems.Remove(item);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Menu item deleted." });
    }

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders()
    {
        var restaurant = await GetOwnedRestaurantAsync();
        if (restaurant == null) return NotFound();
        var orders = await _context.Orders.Where(o => o.RestaurantId == restaurant.Id).Include(o => o.User).OrderByDescending(o => o.CreatedAt).ToListAsync();
        return Ok(orders);
    }

    [HttpPut("orders/{id}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusRequest request)
    {
        var restaurant = await GetOwnedRestaurantAsync();
        if (restaurant == null) return NotFound();

        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id && o.RestaurantId == restaurant.Id);
        if (order == null) return NotFound();
        order.Status = request.Status;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Order status updated." });
    }
}
