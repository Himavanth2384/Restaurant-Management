using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Api.Data;
using RestaurantManagement.Api.Models;

namespace RestaurantManagement.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "SuperAdmin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var restaurants = await _context.Restaurants.ToListAsync();
        var users = await _context.Users.ToListAsync();
        var orders = await _context.Orders.ToListAsync();
        var payments = await _context.Payments.ToListAsync();

        return Ok(new
        {
            totalRestaurants = restaurants.Count,
            pendingRestaurants = restaurants.Count(r => r.Status == "Pending"),
            approvedRestaurants = restaurants.Count(r => r.Status == "Approved"),
            totalUsers = users.Count,
            totalOrders = orders.Count,
            totalRevenue = payments.Sum(p => p.Amount)
        });
    }

    [HttpGet("restaurants")]
    public async Task<IActionResult> GetRestaurants([FromQuery] string? status)
    {
        var query = _context.Restaurants.Include(r => r.Owner).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(r => r.Status == status);
        var restaurants = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
        return Ok(restaurants);
    }

    [HttpGet("restaurants/{id}")]
    public async Task<IActionResult> GetRestaurant(int id)
    {
        var restaurant = await _context.Restaurants.Include(r => r.Owner).FirstOrDefaultAsync(r => r.Id == id);
        return restaurant == null ? NotFound() : Ok(restaurant);
    }

    [HttpPost("restaurants/{id}/approve")]
    public async Task<IActionResult> ApproveRestaurant(int id)
    {
        var restaurant = await _context.Restaurants.FindAsync(id);
        if (restaurant == null) return NotFound();
        restaurant.Status = "Approved";
        await _context.SaveChangesAsync();
        return Ok(new { message = "Restaurant approved." });
    }

    [HttpPost("restaurants/{id}/reject")]
    public async Task<IActionResult> RejectRestaurant(int id)
    {
        var restaurant = await _context.Restaurants.FindAsync(id);
        if (restaurant == null) return NotFound();
        restaurant.Status = "Rejected";
        await _context.SaveChangesAsync();
        return Ok(new { message = "Restaurant rejected." });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? search)
    {
        var query = _context.Users.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(u => u.Name.Contains(search) || u.Email.Contains(search));
        var users = await query.OrderByDescending(u => u.CreatedAt).ToListAsync();
        return Ok(users);
    }

    [HttpPost("users/{id}/toggle")]
    public async Task<IActionResult> ToggleUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.IsActive = !user.IsActive;
        await _context.SaveChangesAsync();
        return Ok(new { message = "User updated." });
    }

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders([FromQuery] string? status, [FromQuery] int? restaurantId)
    {
        var query = _context.Orders.Include(o => o.User).Include(o => o.Restaurant).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(o => o.Status == status);
        if (restaurantId.HasValue) query = query.Where(o => o.RestaurantId == restaurantId.Value);
        var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
        return Ok(orders);
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments()
    {
        var payments = await _context.Payments.Include(p => p.Order).OrderByDescending(p => p.CreatedAt).ToListAsync();
        return Ok(payments);
    }
}
