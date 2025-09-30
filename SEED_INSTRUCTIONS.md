# Database Seeding Instructions

## Overview

The seed file creates sample data for testing and development, including a default admin user.

## Default Admin Credentials

- **Email**: `admin@wpm.com`
- **Password**: `Subin@2055`
- **Role**: `ADMIN`

## Setup Instructions

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Run database migration**:

   ```bash
   npm run db:push
   ```

3. **Run the seed script**:
   ```bash
   npm run db:seed
   ```

## What Gets Created

### Users

- **Admin User**: `admin@whm.com` with ADMIN role
- **Sample Tenant**: `tenant@whm.com` with TENANT role

### Sample Data

- **Property**: Sample Property with address
- **Room**: Sample Room within the property
- **Tenant Profile**: Complete tenant profile with rent information
- **Task**: Weekly cleaning task
- **Task Assignment**: Assigned to the sample tenant
- **Payment**: Sample rent payment

## Notes

⚠️ **Important**: The current seed file creates users without password hashing since the User model doesn't include a password field yet. For production use, you'll need to:

1. Add a `password` field to the User model in your Prisma schema
2. Update the auth configuration to handle password verification
3. Hash passwords before storing them in the database

## Environment Variables

Make sure you have these environment variables set in your `.env.local`:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/chores_db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Troubleshooting

- **"User already exists"**: The seed uses `upsert` so it's safe to run multiple times
- **Database connection errors**: Check your DATABASE_URL
- **Permission errors**: Ensure your database user has CREATE/INSERT permissions
