using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Api.Data;
using RestaurantManagement.Api.DTOs;
using RestaurantManagement.Api.Helpers;
using RestaurantManagement.Api.Models;
using System.Security.Claims;

namespace RestaurantManagement.Api.Controllers;

// Protects all RestaurantOwner APIs
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

        var orders = await _context.Orders
            .Include(order => order.OrderItems)
            .Where(order => order.RestaurantId == restaurant.Id)
            .ToListAsync();
        var today = DateTime.UtcNow.Date;
        var activeOrders = orders.Where(order => order.Status != "Cancelled").ToList();
        var todaysOrders = activeOrders.Where(order => order.CreatedAt.Date == today).ToList();
        var todaysSales = todaysOrders.Sum(order => order.TotalAmount);
        var totalSales = activeOrders.Sum(order => order.TotalAmount);
        var mostOrderedItemToday = todaysOrders
            .SelectMany(order => order.OrderItems)
            .GroupBy(item => item.FoodName)
            .Select(group => new { foodName = group.Key, count = group.Sum(item => item.Quantity) })
            .OrderByDescending(item => item.count)
            .FirstOrDefault();
        var summary = new
        {
            restaurantName = restaurant.Name,
            totalMenuItems = await _context.MenuItems.CountAsync(item => item.RestaurantId == restaurant.Id),
            currentPendingOrders = orders.Count(order => order.Status == "Placed" || order.Status == "Accepted"),
            completedOrders = orders.Count(order => order.Status == "Completed"),
            todaysOrders = todaysOrders.Count,
            totalOrders = orders.Count,
            averageOrderValue = activeOrders.Count == 0 ? 0 : Math.Round(totalSales / activeOrders.Count, 2),
            mostOrderedItemToday,
            todaysSales,
            todaysProfit = Math.Round(todaysSales * 0.30m, 2),
            totalProfit = Math.Round(totalSales * 0.30m, 2)
        };

        return Ok(new
        {
            summary,
            summary.restaurantName,
            summary.todaysOrders,
            pendingOrders = summary.currentPendingOrders,
            summary.completedOrders,
            summary.todaysSales,
            summary.totalMenuItems,
            summary.totalOrders,
            summary.averageOrderValue,
            summary.mostOrderedItemToday,
            summary.todaysProfit,
            summary.totalProfit
        });
    }

    [HttpGet("restaurant")]
    public async Task<IActionResult> GetRestaurant()
    {
        var restaurant = await GetOwnedRestaurantAsync();
        return restaurant == null ? NotFound() : Ok(restaurant);
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var owner = await _context.Users.FindAsync(GetOwnerId());
        return owner == null ? NotFound() : Ok(new { owner.Id, owner.Name, owner.Email, owner.Phone, owner.Address });
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileRequest request)
    {
        var ownerId = GetOwnerId();
        var owner = await _context.Users.FindAsync(ownerId);
        if (owner == null) return NotFound();
        if (string.IsNullOrWhiteSpace(request.Email)) return BadRequest(new { message = "Email is required." });
        if (await _context.Users.AnyAsync(item => item.Email == request.Email && item.Id != ownerId)) return BadRequest(new { message = "Email is already in use." });

        owner.Name = request.Name;
        owner.Email = request.Email;
        owner.Phone = request.Phone;
        owner.Address = request.Address;
        if (!string.IsNullOrWhiteSpace(request.Password)) owner.PasswordHash = PasswordHelper.HashPassword(request.Password);
        await _context.SaveChangesAsync();
        return Ok(new { owner.Id, owner.Name, owner.Email, owner.Phone, owner.Address });
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

    // Analytics processing starts here
    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics()
    {
        var restaurant = await GetOwnedRestaurantAsync();
        if (restaurant == null) return NotFound();

        var today = DateTime.UtcNow.Date;  // Gets today's date using DateTime.UtcNow.Date
        var sevenDayStart = today.AddDays(-6); // Defines the 7-day analytics period
        var thirtyDayStart = today.AddDays(-29); // Defines the 30-day analytics period
        var analyticsOrders = await _context.Orders // Fetches orders for analytics, including order items, filtered by restaurant and date
            .Include(order => order.OrderItems)
            .Where(order => order.RestaurantId == restaurant.Id && order.CreatedAt >= thirtyDayStart)
            .ToListAsync();
        var completedOrders = analyticsOrders.Where(order => order.Status != "Cancelled").ToList(); // Filters out cancelled orders for analytics

        var lastSevenDays = Enumerable.Range(0, 7) // Creates the dates used for the 7-day graphs
            .Select(offset => today.AddDays(-6 + offset))
            .ToList();
        var dailyOrders = lastSevenDays.Select(date => new // Counts orders for each individual day
        {
            date = date.ToString("yyyy-MM-dd"),
            label = date.ToString("ddd"),
            count = completedOrders.Count(order => order.CreatedAt.Date == date) 
        }).ToList();
        var dailySales = lastSevenDays.Select(date => new // Sums sales for each individual day
        {
            date = date.ToString("yyyy-MM-dd"),
            label = date.ToString("ddd"),
            total = completedOrders.Where(order => order.CreatedAt.Date == date).Sum(order => order.TotalAmount)
        }).ToList();

        var thirtyDays = Enumerable.Range(0, 30) // Creates the dates used for the 30-day graphs
            .Select(offset => today.AddDays(-29 + offset))
            .ToList();
        var monthlySales = thirtyDays.Select(date => new // Sums sales for each individual day over the last 30 days
        {
            date = date.ToString("yyyy-MM-dd"),
            label = date.ToString("dd MMM"),
            total = completedOrders.Where(order => order.CreatedAt.Date == date).Sum(order => order.TotalAmount)
        }).ToList();

        var weekDays = new[] { DayOfWeek.Sunday, DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday, DayOfWeek.Saturday };
        var weeklyOrders = weekDays.Select(day => new // Counts orders for each day of the week
        {
            day = day.ToString(),
            count = completedOrders.Count(order => order.CreatedAt.DayOfWeek == day)
        }).ToList();

        var periodDefinitions = new[] // Defines the time periods for hourly food item analysis
        {
            new { Name = "Breakfast", Start = 5, End = 11 },
            new { Name = "Lunch", Start = 11, End = 16 },
            new { Name = "Dinner", Start = 16, End = 22 },
            new { Name = "Late night", Start = 22, End = 5 }
        };
        // Analyzes the top 5 food items for each defined time period
        var hourlyFoodItems = periodDefinitions.Select(period => new
        {
            period = period.Name,
            items = completedOrders
                .Where(order => IsInTimePeriod(order.CreatedAt.Hour, period.Start, period.End))
                .SelectMany(order => order.OrderItems)
                .GroupBy(item => item.FoodName)
                .Select(group => new { foodName = group.Key, count = group.Sum(item => item.Quantity) })
                .OrderByDescending(item => item.count)
                .Take(5)
                .ToList()
        }).ToList();

        var peakHour = Enumerable.Range(0, 24) // Analyzes the peak order time by hour
            .Select(hour => new
            {
                hour,
                count = completedOrders.Count(order => order.CreatedAt.Hour == hour)
            })
            .OrderByDescending(item => item.count)
            .ThenBy(item => item.hour)
            .FirstOrDefault() ?? new { hour = 0, count = 0 };

        return Ok(new
        {
            restaurantName = restaurant.Name,
            last7Days = new
            {
                orders = dailyOrders,
                totalOrders = dailyOrders.Sum(item => item.count),
                sales = dailySales,
                totalSales = dailySales.Sum(item => item.total)
            },
            monthlySales = new
            {
                daily = monthlySales,
                totalOrders = completedOrders.Count,
                totalSales = monthlySales.Sum(item => item.total)
            },
            weeklyOrders,
            hourlyFoodItems,
            topItems = new
            {
                today = GetTopItems(completedOrders, today),
                last7Days = GetTopItems(completedOrders, sevenDayStart),
                last30Days = GetTopItems(completedOrders, thirtyDayStart)
            },
            peakOrderTime = new
            {
                label = FormatHourRange(peakHour.hour),
                count = peakHour.count
            }
        });
    }

    private static bool IsInTimePeriod(int hour, int start, int end)
    {
        return start < end ? hour >= start && hour < end : hour >= start || hour < end;
    }

    private static string FormatHourRange(int hour)
    {
        var start = DateTime.Today.AddHours(hour);
        var end = start.AddHours(1);
        return $"{start:h tt} - {end:h tt}";
    }

    private static IEnumerable<TopItem> GetTopItems(IEnumerable<Order> orders, DateTime startDate)
    {
        return orders
            .Where(order => order.CreatedAt.Date >= startDate.Date)
            .SelectMany(order => order.OrderItems)
            .GroupBy(item => item.FoodName)
            .Select(group => new TopItem(group.Key, group.Sum(item => item.Quantity)))
            .OrderByDescending(item => item.count)
            .Take(5)
            .ToList();
    }

    private sealed record TopItem(string foodName, int count);

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
        var orders = await _context.Orders.Where(o => o.RestaurantId == restaurant.Id).OrderByDescending(o => o.Id).Select(o => new
        {
            o.Id, o.TotalAmount, o.DeliveryAddress, o.Status, o.CreatedAt,
            customer = new { o.User!.Id, o.User.Name, o.User.Email, o.User.Phone, o.User.Address },
            payment = o.Payments.OrderByDescending(item => item.CreatedAt).Select(item => new { item.PaymentMethod }).FirstOrDefault(),
            items = o.OrderItems.Select(item => new { item.Id, item.FoodName, item.Quantity, item.Price, item.Subtotal }).ToList()
        }).ToListAsync();
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
