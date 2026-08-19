using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Api.Data;

namespace RestaurantManagement.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReportsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        var orders = await _context.Orders.ToListAsync();
        var payments = await _context.Payments.ToListAsync();
        var items = await _context.OrderItems.GroupBy(i => i.FoodName).Select(g => new { FoodName = g.Key, Count = g.Sum(x => x.Quantity) }).OrderByDescending(x => x.Count).Take(5).ToListAsync();
        return Ok(new { totalSales = payments.Sum(p => p.Amount), totalOrders = orders.Count, topItems = items });
    }
}
