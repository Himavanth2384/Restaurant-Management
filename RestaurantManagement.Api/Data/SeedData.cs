using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Api.Helpers;
using RestaurantManagement.Api.Models;

namespace RestaurantManagement.Api.Data;

public static class SeedData
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        await context.Database.MigrateAsync();

        var oldFoodCorner = await context.Restaurants.Where(r => r.Name == "Food Corner").ToListAsync();
        if (oldFoodCorner.Count > 0)
        {
            context.Restaurants.RemoveRange(oldFoodCorner);
            await context.SaveChangesAsync();
        }

        if (!await context.Users.AnyAsync())
        {
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
            context.Restaurants.AddRange(restaurantOne, restaurantTwo);
            await context.SaveChangesAsync();
        }

        var restaurants = await context.Restaurants
            .Where(r => r.Name == "Spice Hub" || r.Name == "Green Leaf")
            .ToListAsync();

        foreach (var restaurant in restaurants)
        {
            await SeedMenuCatalogAsync(context, restaurant);
        }

        await SeedCustomerOrdersAsync(context, restaurants);
        await EnsureAnalyticsCoverageAsync(context, restaurants);
    }

    private static async Task SeedMenuCatalogAsync(AppDbContext context, Restaurant restaurant)
    {
        var catalog = restaurant.Name == "Green Leaf"
            ? new[]
            {
                new MenuSeed("Soups & Salads", "Garden Salad", "Crisp greens, cucumber, tomato and house dressing", 140, "Veg"),
                new MenuSeed("Soups & Salads", "Roasted Tomato Soup", "Slow-roasted tomato soup with herbs", 120, "Veg"),
                new MenuSeed("Healthy Bowls", "Quinoa Buddha Bowl", "Quinoa, roasted vegetables, hummus and seeds", 260, "Veg"),
                new MenuSeed("Healthy Bowls", "Paneer Protein Bowl", "Grilled paneer, brown rice and seasonal vegetables", 280, "Veg"),
                new MenuSeed("Indian Mains", "Palak Paneer", "Cottage cheese in a creamy spinach gravy", 240, "Veg"),
                new MenuSeed("Indian Mains", "Veg Biryani", "Aromatic basmati rice with vegetables and spices", 220, "Veg"),
                new MenuSeed("Indian Mains", "Dal Tadka", "Yellow lentils tempered with garlic and cumin", 180, "Veg"),
                new MenuSeed("Asian Plates", "Vegetable Thai Curry", "Mixed vegetables in fragrant coconut curry", 250, "Veg"),
                new MenuSeed("Asian Plates", "Tofu Stir Fry", "Wok-tossed tofu with vegetables and sesame", 230, "Veg"),
                new MenuSeed("Asian Plates", "Hakka Noodles", "Wheat noodles with vegetables and soy", 190, "Veg"),
                new MenuSeed("Breakfast", "Masala Dosa", "Crisp dosa with potato masala and chutneys", 120, "Veg"),
                new MenuSeed("Breakfast", "Idli Sambar", "Steamed rice cakes with sambar and chutney", 110, "Veg"),
                new MenuSeed("Beverages", "Cold Coffee", "Iced coffee blended with milk", 90, "Veg"),
                new MenuSeed("Beverages", "Mango Smoothie", "Fresh mango blended with yogurt", 130, "Veg"),
                new MenuSeed("Beverages", "Fresh Lime Soda", "Chilled lime soda, sweet or salted", 80, "Veg")
            }
            : new[]
            {
                new MenuSeed("Starters", "Paneer Tikka", "Spiced paneer grilled with peppers and onions", 180, "Veg"),
                new MenuSeed("Starters", "Chicken Seekh Kebab", "Minced chicken kebabs with aromatic spices", 240, "NonVeg"),
                new MenuSeed("Starters", "Tandoori Wings", "Chargrilled chicken wings with smoky spices", 260, "NonVeg"),
                new MenuSeed("Main Course", "Butter Chicken", "Creamy tomato chicken curry", 260, "NonVeg"),
                new MenuSeed("Main Course", "Shahi Paneer", "Paneer in a rich cashew and tomato gravy", 230, "Veg"),
                new MenuSeed("Main Course", "Dal Makhani", "Slow-cooked black lentils with butter", 190, "Veg"),
                new MenuSeed("Main Course", "Rogan Josh", "Tender lamb curry with Kashmiri spices", 320, "NonVeg"),
                new MenuSeed("Rice & Breads", "Chicken Biryani", "Fragrant basmati rice layered with chicken", 280, "NonVeg"),
                new MenuSeed("Rice & Breads", "Jeera Rice", "Basmati rice tempered with cumin", 130, "Veg"),
                new MenuSeed("Rice & Breads", "Garlic Naan", "Tandoor-baked naan with garlic and butter", 70, "Veg"),
                new MenuSeed("Rice & Breads", "Stuffed Kulcha", "Leavened bread stuffed with spiced potato", 100, "Veg"),
                new MenuSeed("Desserts", "Gulab Jamun", "Warm milk dumplings in saffron syrup", 100, "Veg"),
                new MenuSeed("Desserts", "Kesar Kulfi", "Traditional saffron and pistachio ice cream", 130, "Veg"),
                new MenuSeed("Beverages", "Masala Chai", "Indian spiced tea with milk", 60, "Veg"),
                new MenuSeed("Beverages", "Mango Lassi", "Chilled yogurt drink with mango", 110, "Veg")
            };

        var categoryNames = catalog.Select(item => item.CategoryName).Distinct().ToList();
        var categories = await context.Categories
            .Where(c => c.RestaurantId == restaurant.Id && categoryNames.Contains(c.Name))
            .ToDictionaryAsync(c => c.Name);

        foreach (var categoryName in categoryNames)
        {
            if (!categories.ContainsKey(categoryName))
            {
                var category = new Category { Name = categoryName, RestaurantId = restaurant.Id };
                context.Categories.Add(category);
                categories[categoryName] = category;
            }
        }

        await context.SaveChangesAsync();

        var itemNames = catalog.Select(item => item.Name).ToList();
        var existingItems = await context.MenuItems
            .Where(item => item.RestaurantId == restaurant.Id && itemNames.Contains(item.Name))
            .Select(item => item.Name)
            .ToListAsync();
        var existingItemNames = existingItems.ToHashSet();

        context.MenuItems.AddRange(catalog
            .Where(item => !existingItemNames.Contains(item.Name))
            .Select(item => new MenuItem
            {
                Name = item.Name,
                Description = item.Description,
                Price = item.Price,
                FoodType = item.FoodType,
                CategoryId = categories[item.CategoryName].Id,
                RestaurantId = restaurant.Id,
                IsAvailable = true
            }));

        await context.SaveChangesAsync();
    }

    private static async Task SeedCustomerOrdersAsync(AppDbContext context, List<Restaurant> restaurants)
    {
        var customers = await context.Users
            .Where(user => user.Role == "User")
            .ToListAsync();
        var menuItems = await context.MenuItems
            .Where(item => restaurants.Select(restaurant => restaurant.Id).Contains(item.RestaurantId))
            .OrderBy(item => item.Id)
            .ToListAsync();

        if (customers.Count == 0 || menuItems.Count == 0) return;

        var seededAt = DateTime.UtcNow;
        var orderHours = new[] { 8, 9, 10, 12, 13, 14, 18, 19, 20, 21, 11, 15, 17, 22 };

        foreach (var customer in customers)
        {
            var existingOrderCount = await context.Orders.CountAsync(order => order.UserId == customer.Id);
            var ordersToCreate = Math.Max(0, 35 - existingOrderCount);

            for (var orderIndex = 0; orderIndex < ordersToCreate; orderIndex++)
            {
                var orderNumber = existingOrderCount + orderIndex;
                var restaurant = restaurants[orderIndex % restaurants.Count];
                var restaurantMenu = menuItems.Where(item => item.RestaurantId == restaurant.Id).ToList();
                var firstItem = restaurantMenu[(orderNumber * 2) % restaurantMenu.Count];
                var secondItem = restaurantMenu[(orderNumber * 2 + 1) % restaurantMenu.Count];
                var firstQuantity = orderNumber % 3 == 0 ? 2 : 1;
                var secondQuantity = orderNumber % 4 == 0 ? 2 : 1;
                var orderItems = new List<OrderItem>
                {
                    CreateOrderItem(firstItem, firstQuantity),
                    CreateOrderItem(secondItem, secondQuantity)
                };
                var total = orderItems.Sum(item => item.Subtotal);
                var status = new[] { "Completed", "Completed", "Preparing", "Accepted", "Placed" }[orderNumber % 5];
                var paymentMethod = new[] { "UPI", "Card", "Cash on Delivery" }[orderNumber % 3];
                var createdAt = seededAt
                    .Date
                    .AddDays(-(orderNumber + 1))
                    .AddHours(orderHours[orderNumber % orderHours.Length])
                    .AddMinutes((orderNumber * 7) % 60);

                context.Orders.Add(new Order
                {
                    UserId = customer.Id,
                    RestaurantId = restaurant.Id,
                    TotalAmount = total,
                    DeliveryAddress = customer.Address,
                    Status = status,
                    CreatedAt = createdAt,
                    OrderItems = orderItems,
                    Payments = new List<Payment>
                    {
                        new Payment
                        {
                            Amount = total,
                            PaymentMethod = paymentMethod,
                            Status = status == "Completed" ? "Paid" : "Pending"
                        }
                    }
                });
            }
        }

        await context.SaveChangesAsync();
    }

    private static OrderItem CreateOrderItem(MenuItem menuItem, int quantity)
    {
        return new OrderItem
        {
            MenuItemId = menuItem.Id,
            FoodName = menuItem.Name,
            Quantity = quantity,
            Price = menuItem.Price,
            Subtotal = menuItem.Price * quantity
        };
    }


    private static async Task EnsureAnalyticsCoverageAsync(AppDbContext context, List<Restaurant> restaurants)
    {
        var customers = await context.Users.Where(user => user.Role == "User").ToListAsync();
        var seededAt = DateTime.UtcNow;
        var orderHours = new[] { 8, 12, 13, 18, 19, 21 };

        foreach (var restaurant in restaurants)
        {
            var restaurantMenu = await context.MenuItems
                .Where(item => item.RestaurantId == restaurant.Id)
                .OrderBy(item => item.Id)
                .ToListAsync();
            if (restaurantMenu.Count == 0 || customers.Count == 0) continue;

            for (var dayOffset = 29; dayOffset >= 0; dayOffset--)
            {
                var date = seededAt.Date.AddDays(-dayOffset);
                var nextDate = date.AddDays(1);
                var existingCount = await context.Orders.CountAsync(order =>
                    order.RestaurantId == restaurant.Id &&
                    order.Status != "Cancelled" &&
                    order.CreatedAt >= date &&
                    order.CreatedAt < nextDate);
                var ordersToCreate = Math.Max(0, 2 - existingCount);

                for (var orderIndex = 0; orderIndex < ordersToCreate; orderIndex++)
                {
                    var sequence = dayOffset * 2 + orderIndex;
                    var firstItem = restaurantMenu[sequence % restaurantMenu.Count];
                    var secondItem = restaurantMenu[(sequence + 1) % restaurantMenu.Count];
                    var orderItems = new List<OrderItem>
                    {
                        CreateOrderItem(firstItem, sequence % 3 == 0 ? 2 : 1),
                        CreateOrderItem(secondItem, sequence % 4 == 0 ? 2 : 1)
                    };
                    var total = orderItems.Sum(item => item.Subtotal);
                    var customer = customers[sequence % customers.Count];

                    context.Orders.Add(new Order
                    {
                        UserId = customer.Id,
                        RestaurantId = restaurant.Id,
                        TotalAmount = total,
                        DeliveryAddress = customer.Address,
                        Status = "Completed",
                        CreatedAt = date.AddHours(orderHours[sequence % orderHours.Length]).AddMinutes((sequence * 11) % 60),
                        OrderItems = orderItems,
                        Payments = new List<Payment>
                        {
                            new Payment
                            {
                                Amount = total,
                                PaymentMethod = new[] { "UPI", "Card", "Cash on Delivery" }[sequence % 3],
                                Status = "Paid"
                            }
                        }
                    });
                }
            }
        }

        await context.SaveChangesAsync();
    }
    private sealed record MenuSeed(string CategoryName, string Name, string Description, decimal Price, string FoodType);
}
