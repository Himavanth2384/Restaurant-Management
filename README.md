# Restaurant Management System

A full-stack restaurant management app built with ASP.NET Core Web API, Entity Framework Core with SQLite, and React.

## Features
- JWT authentication and role-based access
- Super admin dashboard and restaurant approval flow
- Restaurant owner dashboard, account settings, restaurant profile, categories, menu, and order management
- Customer restaurant browsing with Veg/Non-Veg menu filtering
- Customer cart, ordering, payment method selection, and order history
- Expandable order details for customers and restaurant owners

## Roles
- SuperAdmin
- RestaurantOwner
- User

## Default login
- Super admin: admin@gmail.com / Admin@123
- Restaurant owner1: owner1@gmail.com / Owner@123
- Restaurant owner2: owner2@gmail.com / Owner@123
- Customer: user@gmail.com / User@123

## Backend
Run from the API folder:

```bash
dotnet run
```

The API will run at http://localhost:5277.

## Frontend
Run from the frontend folder:

```bash
npm run dev
```

The Vite app will run at http://localhost:5173.

## Main routes
- Customer: `/restaurants`, `/cart`, `/orders`, `/settings`
- Restaurant owner: `/owner/dashboard`, `/owner/categories`, `/owner/menu`, `/owner/orders`, `/owner/restaurant`, `/owner/settings`
- Super admin: `/admin/dashboard`

## Project structure
- RestaurantManagement.Api: ASP.NET Core backend
- frontend: React frontend

## Database
SQLite is used through EF Core. Migrations are created in the API project.
