# Restaurant Management System

A full-stack restaurant management system built with ASP.NET Core Web API, Entity Framework Core, SQLite, and Vite + React.

## Overview

This project supports three primary roles:

- SuperAdmin: system-wide analytics and restaurant owner/user administration
- RestaurantOwner: restaurant profile, menu, categories, and order management
- User: customer browsing, cart, ordering, and order history

## Features

- JWT-based authentication with role-aware API endpoints
- SuperAdmin analytics dashboard and restaurant visibility management
- Admin restaurant owner and customer profile card views
- Owner dashboard for restaurant setup, menu and category management
- Customer restaurant listings, search, menu filtering, cart, and order placement
- SQLite-backed data storage with seeded demo users, restaurants, menu items, and orders
- Responsive Vite frontend with React Router navigation

## Default Logins

- Super admin: `admin@gmail.com` / `Admin@123`
- Restaurant owner 1: `owner1@gmail.com` / `Owner@123`
- Restaurant owner 2: `owner2@gmail.com` / `Owner@123`
- Customer: `user@gmail.com` / `User@123`

## Project Structure

- `RestaurantManagement.Api/` — ASP.NET Core backend, controllers, models, DTOs, EF Core context, JWT helpers, and SQLite migrations
- `frontend/` — Vite + React application

## Backend Setup

From the workspace root:

```bash
dotnet run --project RestaurantManagement.Api
```

The API starts with the configured launch profile and is usually available on:

http://localhost:5277

## Frontend Setup

From the workspace root:

```bash
npm --prefix frontend run dev
```

Or from the `frontend` folder:

```bash
npm run dev
```

The Vite frontend usually runs on:

http://localhost:5173

## Main Routes

- Customer: `/restaurants`, `/cart`, `/orders`, `/settings`
- Restaurant owner: `/owner/dashboard`, `/owner/categories`, `/owner/menu`, `/owner/orders`, `/owner/restaurant`, `/owner/settings`
- Super admin: `/admin/dashboard`

## Database

The backend uses SQLite through Entity Framework Core. Data initialization and seed data live in the API project, and migrations are kept under `RestaurantManagement.Api/Migrations`.

## Build

Frontend build:

```bash
npm --prefix frontend run build
```

Backend build:

```bash
dotnet build RestaurantManagement.Api/RestaurantManagement.Api.csproj
```

## Notes

- The API returns JSON from the ASP.NET Core controllers and uses DTOs and EF Core models for restaurant, owner, order, menu, customer, and analytics data.
- The frontend uses a shared API request wrapper and page components in `frontend/src/pages`.
- Image URL fields have been removed from the current contract and UI cards in the active implementation, so the codebase reflects the updated simplified data model.
