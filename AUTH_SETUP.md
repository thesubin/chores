# Authentication Setup Guide

## Overview

Authentication has been configured for the Chores app with the following features:

- **Route Protection**: All routes except the landing page (`/`) require authentication
- **Role-Based Access**: Admin and Tenant roles with different permissions
- **Middleware Protection**: Automatic redirects for unauthenticated users
- **tRPC Integration**: Protected procedures with role-based access control

## Environment Variables Required

Create a `.env.local` file in your project root with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/chores_db"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Discord OAuth (for authentication)
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"
```

## Authentication Flow

### 1. Landing Page (Public)

- **Route**: `/`
- **Access**: Public (no authentication required)
- **Behavior**: Redirects authenticated users to dashboard

### 2. Protected Routes

- **Routes**: `/dashboard`, `/properties`, `/tenants`, `/tasks`, etc.
- **Access**: Authenticated users only
- **Behavior**: Redirects unauthenticated users to sign-in

### 3. Admin-Only Routes

- **Routes**: `/admin/*`, `/properties/*`, `/tenants/*`, `/tasks/*`
- **Access**: Users with ADMIN role only
- **Behavior**: Redirects non-admin users to dashboard

### 4. API Routes

- **Routes**: `/api/auth/*` (public), `/api/trpc/*` (protected)
- **Access**: Based on procedure type (public, protected, admin, tenant)

## User Roles

### ADMIN

- Full access to all features
- Can manage properties, rooms, tenants
- Can assign and monitor tasks
- Can view all tenant data and reports

### TENANT

- Access to personal dashboard
- Can view assigned tasks
- Can mark tasks as completed
- Can submit requests
- Can view payment history

## tRPC Procedures

### Public Procedures

- Available without authentication
- Example: `api.post.hello`

### Protected Procedures

- Require authentication
- Example: `api.auth.getUser`

### Admin Procedures

- Require ADMIN role
- Example: `api.property.create`

### Tenant Procedures

- Require TENANT role
- Example: `api.tenant.getMyProfile`

## Setup Instructions

1. **Set up environment variables** (see above)

2. **Set up Discord OAuth**:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to OAuth2 settings
   - Add redirect URI: `http://localhost:3000/api/auth/callback/discord`
   - Copy Client ID and Client Secret to environment variables

3. **Run database migrations**:

   ```bash
   npx prisma migrate dev
   ```

4. **Generate Prisma client**:

   ```bash
   npx prisma generate
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

## Testing Authentication

1. **Visit the landing page**: `http://localhost:3000`
2. **Click "Get Started"** to sign in
3. **Complete Discord OAuth flow**
4. **Verify redirect to dashboard**
5. **Test role-based access**:
   - Create a user and set their role in the database
   - Test admin vs tenant permissions

## Database Schema Updates

The authentication system requires the following updates to your database:

1. **User model** includes `role` field
2. **NextAuth tables** for sessions and accounts
3. **Tenant profiles** linked to users

Run the migration to apply these changes:

```bash
npx prisma migrate dev --name add_auth_schema
```

## Security Features

- **CSRF Protection**: Built into NextAuth.js
- **Session Management**: Secure session handling
- **Route Protection**: Middleware-level protection
- **Role-Based Access**: Granular permission control
- **Type Safety**: Full TypeScript integration

## Troubleshooting

### Common Issues

1. **"UNAUTHORIZED" errors**: Check if user is signed in
2. **"FORBIDDEN" errors**: Check user role permissions
3. **Redirect loops**: Verify middleware configuration
4. **Session not persisting**: Check NEXTAUTH_SECRET and NEXTAUTH_URL

### Debug Mode

Enable debug mode by adding to your environment:

```bash
NEXTAUTH_DEBUG=true
```

This will provide detailed logs for authentication issues.
