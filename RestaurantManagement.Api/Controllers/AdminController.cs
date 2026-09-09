using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Api.Data;
using RestaurantManagement.Api.DTOs;
using RestaurantManagement.Api.Helpers;
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
        var activeOrders = orders.Where(order => order.Status != "Cancelled").ToList();
        var today = DateTime.UtcNow.Date;
        var todaysOrders = activeOrders.Where(order => order.CreatedAt.Date == today).ToList();

        return Ok(new
        {
            totalRestaurants = restaurants.Count,
            pendingRestaurants = restaurants.Count(r => r.Status == "Pending"),
            approvedRestaurants = restaurants.Count(r => r.Status == "Approved"),
            totalUsers = users.Count(user => user.Role == "User"),
            totalOrders = orders.Count,
            totalRevenue = activeOrders.Sum(order => order.TotalAmount),
            activeRestaurants = restaurants.Count(r => r.IsActive),
            todaysOrders = todaysOrders.Count,
            todaysRevenue = todaysOrders.Sum(order => order.TotalAmount)
        });
    }

    [HttpGet("analytics")]
    public async Task<IActionResult> Analytics()
    {
        var today = DateTime.UtcNow.Date;
        var startDate = today.AddDays(-29);
        var restaurants = await _context.Restaurants.OrderBy(restaurant => restaurant.Id).ToListAsync();
        var orders = await _context.Orders
            .Include(order => order.OrderItems)
            .Where(order => order.CreatedAt >= startDate)
            .ToListAsync();
        var activeOrders = orders.Where(order => order.Status != "Cancelled").ToList();
        var customers = await _context.Users.Where(user => user.Role == "User").ToListAsync();

        var restaurantComparison = restaurants.Select(restaurant =>
        {
            var restaurantOrders = activeOrders.Where(order => order.RestaurantId == restaurant.Id).ToList();
            var sales = restaurantOrders.Sum(order => order.TotalAmount);
            return new
            {
                id = restaurant.Id,
                name = restaurant.Name,
                totalSales = sales,
                totalOrders = restaurantOrders.Count,
                averageOrderValue = restaurantOrders.Count == 0 ? 0 : Math.Round(sales / restaurantOrders.Count, 2)
            };
        }).ToList();

        var lastSevenDates = Enumerable.Range(0, 7).Select(offset => today.AddDays(-6 + offset)).ToList();
        var weeklyRevenue = lastSevenDates.Select(date => new
        {
            date = date.ToString("yyyy-MM-dd"),
            label = date.ToString("ddd"),
            restaurants = restaurants.Select(restaurant => new
            {
                restaurantId = restaurant.Id,
                restaurantName = restaurant.Name,
                total = activeOrders.Where(order => order.RestaurantId == restaurant.Id && order.CreatedAt.Date == date).Sum(order => order.TotalAmount)
            }).ToList()
        }).ToList();

        var monthlyRevenue = Enumerable.Range(0, 30).Select(offset => today.AddDays(-29 + offset)).Select(date => new
        {
            date = date.ToString("yyyy-MM-dd"),
            label = date.ToString("dd MMM"),
            total = activeOrders.Where(order => order.CreatedAt.Date == date).Sum(order => order.TotalAmount)
        }).ToList();

        var topItems = activeOrders
            .SelectMany(order => order.OrderItems)
            .GroupBy(item => item.FoodName)
            .Select(group => new { foodName = group.Key, count = group.Sum(item => item.Quantity) })
            .OrderByDescending(item => item.count)
            .Take(10)
            .ToList();
        var peakHour = Enumerable.Range(0, 24)
            .Select(hour => new { hour, count = activeOrders.Count(order => order.CreatedAt.Hour == hour) })
            .OrderByDescending(item => item.count)
            .ThenBy(item => item.hour)
            .FirstOrDefault() ?? new { hour = 0, count = 0 };

        return Ok(new
        {
            summary = new
            {
                totalRestaurants = restaurants.Count,
                activeRestaurants = restaurants.Count(restaurant => restaurant.IsActive),
                totalCustomers = customers.Count,
                todaysOrders = activeOrders.Count(order => order.CreatedAt.Date == today),
                todaysRevenue = activeOrders.Where(order => order.CreatedAt.Date == today).Sum(order => order.TotalAmount),
                totalOrders = activeOrders.Count,
                totalRevenue = activeOrders.Sum(order => order.TotalAmount),
                newCustomers7Days = customers.Count(user => user.CreatedAt.Date >= today.AddDays(-6)),
                newCustomers30Days = customers.Count(user => user.CreatedAt.Date >= startDate)
            },
            restaurantComparison,
            weeklyRevenue,
            monthlyRevenue,
            topItems,
            peakOrderTime = new { label = FormatHourRange(peakHour.hour), count = peakHour.count }
        });
    }

    private static string FormatHourRange(int hour)
    {
        var start = DateTime.Today.AddHours(hour);
        var end = start.AddHours(1);
        return $"{start:h tt} - {end:h tt}";
    }

    [HttpGet("restaurants")]
    public async Task<IActionResult> GetRestaurants([FromQuery] string? status)
    {
        var query = _context.Restaurants.Include(r => r.Owner).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(r => r.Status == status);

        var restaurants = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                id = r.Id,
                name = r.Name,
                description = r.Description,
                address = r.Address,
                phone = r.Phone,
                email = r.Email,
                openingTime = r.OpeningTime,
                closingTime = r.ClosingTime,
                ownerId = r.OwnerId,
                status = r.Status,
                isActive = r.IsActive,
                createdAt = r.CreatedAt,
                ownerName = r.Owner != null ? r.Owner.Name : null,
                owner = r.Owner == null ? null : new
                {
                    id = r.Owner.Id,
                    name = r.Owner.Name,
                    email = r.Owner.Email,
                    phone = r.Owner.Phone,
                    address = r.Owner.Address,
                    role = r.Owner.Role,
                    isActive = r.Owner.IsActive,
                    createdAt = r.Owner.CreatedAt
                }
            })
            .ToListAsync();

        return Ok(restaurants);
    }

    [HttpGet("restaurants/{id}/menu")]
    public async Task<IActionResult> GetRestaurantMenu(int id)
    {
        var restaurant = await _context.Restaurants.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id);
        if (restaurant == null) return NotFound();

        var items = await _context.MenuItems
            .Include(m => m.Category)
            .Where(m => m.RestaurantId == id)
            .OrderBy(m => m.Name)
            .Select(m => new
            {
                id = m.Id,
                name = m.Name,
                description = m.Description,
                price = m.Price,
                foodType = m.FoodType,
                categoryName = m.Category != null ? m.Category.Name : "General",
                isAvailable = m.IsAvailable,
                restaurantId = m.RestaurantId,
                createdAt = m.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            restaurant = new { id = restaurant.Id, name = restaurant.Name },
            menuItems = items
        });
    }

    [HttpPut("restaurants/{id}/visibility")]
    public async Task<IActionResult> UpdateRestaurantVisibility(int id, [FromBody] UpdateRestaurantVisibilityRequest request)
    {
        var restaurant = await _context.Restaurants.FindAsync(id);
        if (restaurant == null) return NotFound();
        restaurant.IsActive = request.IsVisible;
        await _context.SaveChangesAsync();
        return Ok(restaurant);
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
        var query = _context.Users.Include(u => u.Restaurants).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(u => u.Name.Contains(search) || u.Email.Contains(search));
        var users = await query.OrderByDescending(u => u.CreatedAt).ToListAsync();
        var userDetails = users.Select(u => new
        {
            u.Id, u.Name, u.Email, u.Phone, u.Address, u.Role, u.IsActive, u.CreatedAt,
            restaurants = u.Restaurants.Select(r => new { r.Id, r.Name, r.IsActive, r.Status }).ToList()
        });
        return Ok(userDetails);
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var admin = await _context.Users.FindAsync(adminId);
        return admin == null ? NotFound() : Ok(new { admin.Id, admin.Name, admin.Email, admin.Phone, admin.Address });
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateAdminProfileRequest request)
    {
        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var admin = await _context.Users.FindAsync(adminId);
        if (admin == null) return NotFound();
        if (string.IsNullOrWhiteSpace(request.Email)) return BadRequest(new { message = "Email is required." });
        if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.Id != adminId)) return BadRequest(new { message = "Email is already in use." });

        admin.Email = request.Email;
        if (!string.IsNullOrWhiteSpace(request.Password)) admin.PasswordHash = PasswordHelper.HashPassword(request.Password);
        await _context.SaveChangesAsync();
        return Ok(new { admin.Id, admin.Name, admin.Email, admin.Phone, admin.Address });
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();
        if (user.Role == "SuperAdmin") return BadRequest(new { message = "The administrator cannot be deleted." });
        var orders = await _context.Orders.Where(o => o.UserId == id).ToListAsync();
        var orderIds = orders.Select(o => o.Id).ToList();
        var carts = await _context.Carts.Where(c => c.UserId == id).ToListAsync();
        var cartIds = carts.Select(c => c.Id).ToList();
        _context.Payments.RemoveRange(await _context.Payments.Where(p => orderIds.Contains(p.OrderId)).ToListAsync());
        _context.OrderItems.RemoveRange(await _context.OrderItems.Where(i => orderIds.Contains(i.OrderId)).ToListAsync());
        _context.Orders.RemoveRange(orders);
        _context.CartItems.RemoveRange(await _context.CartItems.Where(i => cartIds.Contains(i.CartId)).ToListAsync());
        _context.Carts.RemoveRange(carts);
        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return Ok(new { message = "User deleted." });
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
        var orders = await query.OrderByDescending(o => o.Id).Select(o => new
        {
            o.Id, o.TotalAmount, o.DeliveryAddress, o.Status, o.CreatedAt,
            customer = new { o.User!.Id, o.User.Name, o.User.Email },
            restaurant = new { o.Restaurant!.Id, o.Restaurant.Name }
        }).ToListAsync();
        return Ok(orders);
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments()
    {
        var payments = await _context.Payments.Include(p => p.Order).OrderByDescending(p => p.CreatedAt).ToListAsync();
        return Ok(payments);
    }
}
