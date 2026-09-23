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
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required." });
        }

        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            return BadRequest(new { message = "User already exists." });
        }

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            PasswordHash = PasswordHelper.HashPassword(request.Password),
            Phone = request.Phone,
            Address = request.Address,
            Role = "User"
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = JwtHelper.GenerateToken(user, _configuration);
        return Ok(new AuthResponse { Token = token, Role = user.Role, Name = user.Name, UserId = user.Id });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // Finds the user by email
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        // Checks if the user exists, if the password is correct, and if the user is active
        if (user == null || !PasswordHelper.VerifyPassword(request.Password, user.PasswordHash) || !user.IsActive)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        // Generates a JWT token for the authenticated user
        var token = JwtHelper.GenerateToken(user, _configuration);
        // Returns the token and Role to the frontend
        return Ok(new AuthResponse { Token = token, Role = user.Role, Name = user.Name, UserId = user.Id });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var user = await _context.Users.FindAsync(userId);
        return user == null ? NotFound() : Ok(new { user.Id, user.Name, user.Email, user.Role, user.Phone, user.Address });
    }
}
