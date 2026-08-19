cd "d:\Projects\Restaurant Management System\frontend"
npm run dev# Restaurant Management System

A simple full-stack restaurant management app built with ASP.NET Core Web API, Entity Framework Core with SQLite, and React.

## Features
- JWT authentication and role-based access
- Super admin dashboard and restaurant approval flow
- Restaurant owner dashboard, category, menu, and order management
- Customer browsing, cart, ordering, and order history

## Roles
- SuperAdmin
- RestaurantOwner
- User

## Default login
- Super admin: admin@example.com / Admin@123
- Restaurant owner: owner1@example.com / Owner@123
- Customer: user@example.com / User@123

## Backend
Run from the API folder:

```bash
dotnet run
```

The API will run at http://localhost:5200.

## Frontend
Run from the frontend folder:

```bash
npm run dev
```

The Vite app will run at http://localhost:5173.

## Project structure
- RestaurantManagement.Api: ASP.NET Core backend
- frontend: React frontend

## Database
SQLite is used through EF Core. Migrations are created in the API project.
