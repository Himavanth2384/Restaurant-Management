using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Api.Helpers;
using RestaurantManagement.Api.Models;

namespace RestaurantManagement.Api.Data;

public static class SeedData
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        await context.Database.MigrateAsync();

        if (await context.Users.AnyAsync()) return;

        var admin = new User
        {
            Name = "Super Admin",
            Email = "admin@gmail.com",
            PasswordHash = PasswordHelper.HashPassword("Admin@123"),
            Phone = "9999999999",
            Address = "Head Office",
            Role = "SuperAdmin",
            IsActive = true
        };
        context.Users.Add(admin);
        await context.SaveChangesAsync();

        var ownerOne = new User { Name = "Amit Sharma", Email = "owner1@gmail.com", PasswordHash = PasswordHelper.HashPassword("Owner@123"), Phone = "8888888888", Address = "Delhi", Role = "RestaurantOwner", IsActive = true };
        var ownerTwo = new User { Name = "Neha Verma", Email = "owner2@gmail.com", PasswordHash = PasswordHelper.HashPassword("Owner@123"), Phone = "7777777777", Address = "Mumbai", Role = "RestaurantOwner", IsActive = true };
        context.Users.AddRange(ownerOne, ownerTwo);
        await context.SaveChangesAsync();

        var customer = new User { Name = "Ravi Kumar", Email = "user@gmail.com", PasswordHash = PasswordHelper.HashPassword("User@123"), Phone = "6666666666", Address = "Bengaluru", Role = "User", IsActive = true };
        context.Users.Add(customer);
        await context.SaveChangesAsync();

        var restaurantOne = new Restaurant { Name = "Spice Hub", Description = "North Indian specialties", Address = "Connaught Place", Phone = "1111111111", Email = "spice@gmail.com", OpeningTime = "10:00", ClosingTime = "22:00", OwnerId = ownerOne.Id, Status = "Approved", IsActive = true };
        var restaurantTwo = new Restaurant { Name = "Green Leaf", Description = "Healthy vegetarian meals", Address = "Koramangala", Phone = "2222222222", Email = "green@gmail.com", OpeningTime = "11:00", ClosingTime = "23:00", OwnerId = ownerTwo.Id, Status = "Approved", IsActive = true };
        var restaurantThree = new Restaurant { Name = "Food Corner", Description = "Fast food and snacks", Address = "Andheri", Phone = "3333333333", Email = "food@gmail.com", OpeningTime = "09:00", ClosingTime = "21:00", OwnerId = ownerTwo.Id, Status = "Pending", IsActive = true };
        context.Restaurants.AddRange(restaurantOne, restaurantTwo, restaurantThree);
        await context.SaveChangesAsync();

        var starters = new Category { Name = "Starters", RestaurantId = restaurantOne.Id };
        var mainCourse = new Category { Name = "Main Course", RestaurantId = restaurantOne.Id };
        var beverages = new Category { Name = "Beverages", RestaurantId = restaurantTwo.Id };
        context.Categories.AddRange(starters, mainCourse, beverages);
        await context.SaveChangesAsync();

        context.MenuItems.AddRange(
            new MenuItem { Name = "Paneer Tikka", Description = "Spiced grilled paneer", Price = 180, FoodType = "Veg", CategoryId = starters.Id, RestaurantId = restaurantOne.Id, IsAvailable = true },
            new MenuItem { Name = "Butter Chicken", Description = "Creamy tomato chicken curry", Price = 260, FoodType = "NonVeg", CategoryId = mainCourse.Id, RestaurantId = restaurantOne.Id, IsAvailable = true },
            new MenuItem { Name = "Masala Dosa", Description = "Crispy dosa with potato filling", Price = 120, FoodType = "Veg", CategoryId = mainCourse.Id, RestaurantId = restaurantOne.Id, IsAvailable = true },
            new MenuItem { Name = "Cold Coffee", Description = "Iced coffee", Price = 90, FoodType = "Veg", CategoryId = beverages.Id, RestaurantId = restaurantTwo.Id, IsAvailable = true },
            new MenuItem { Name = "Veg Biryani", Description = "Aromatic rice with vegetables", Price = 220, FoodType = "Veg", CategoryId = mainCourse.Id, RestaurantId = restaurantTwo.Id, IsAvailable = true }
        );
        await context.SaveChangesAsync();
    }
}
