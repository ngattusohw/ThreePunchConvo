# 3PunchConvo

MVP -- not working, purely for demo purposes

## Getting Started

### Prerequisites

1. Install Node.js and npm:

```bash
# Using homebrew on macOS
brew install node

# Verify installation
node --version
npm --version
```

2. Install PostgreSQL 14:

```bash
# Using homebrew on macOS
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14
```

### Database Setup

There are two options for setting up the database:

#### Option 1: Local PostgreSQL (Recommended for Development)

1. Create a new database:

```bash
createdb threepunchconvo
```

2. Create a `.env` file in the project root and add:

```bash
DATABASE_URL=postgres://localhost:5432/threepunchconvo
```

3. Install project dependencies:

```bash
npm install
```

4. Run database setup:

```bash
# First create tables without foreign key constraints
npm run db:push

# Then add foreign key constraints
# If using local database:
psql -d threepunchconvo -f migrations/004_add_foreign_keys.sql
# If using Neon:
psql "your_neon_connection_string" -f migrations/004_add_foreign_keys.sql
```

5. Initialize forum categories:

```bash
# If using local database:
psql -d threepunchconvo -c "INSERT INTO categories (id, name, description, count) VALUES
('ufc', 'UFC', 'Ultimate Fighting Championship discussions', 0),
('general', 'General', 'General MMA discussions', 0),
('boxing', 'Boxing', 'Boxing discussions', 0),
('bellator', 'Bellator', 'Bellator MMA discussions', 0),
('pfl', 'PFL', 'Professional Fighters League discussions', 0),
('one', 'ONE', 'ONE Championship discussions', 0);"

# If using Neon:
psql "your_neon_connection_string" -c "INSERT INTO categories (id, name, description, count) VALUES
('ufc', 'UFC', 'Ultimate Fighting Championship discussions', 0),
('general', 'General', 'General MMA discussions', 0),
('boxing', 'Boxing', 'Boxing discussions', 0),
('bellator', 'Bellator', 'Bellator MMA discussions', 0),
('pfl', 'PFL', 'Professional Fighters League discussions', 0),
('one', 'ONE', 'ONE Championship discussions', 0);"
```

#### Option 2: Neon (Cloud Hosted)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy your connection string from the dashboard (it should look like: `postgresql://user:password@hostname/dbname?sslmode=require`)
4. Add it to your `.env` file:

```bash
DATABASE_URL=your_neon_connection_string
```

5. Install project dependencies:

```bash
npm install
```

6. Run database setup:

```bash
# First create tables without foreign key constraints
npm run db:push

# Then add foreign key constraints
psql "your_neon_connection_string" -f migrations/004_add_foreign_keys.sql
```

7. Initialize forum categories:

```bash
psql "your_neon_connection_string" -c "INSERT INTO categories (id, name, description, count) VALUES
('ufc', 'UFC', 'Ultimate Fighting Championship discussions', 0),
('general', 'General', 'General MMA discussions', 0),
('boxing', 'Boxing', 'Boxing discussions', 0),
('bellator', 'Bellator', 'Bellator MMA discussions', 0),
('pfl', 'PFL', 'Professional Fighters League discussions', 0),
('one', 'ONE', 'ONE Championship discussions', 0);"
```

Note: Replace `your_neon_connection_string` with your actual Neon database connection string. It should look something like:

```
postgresql://user:password@hostname/dbname?sslmode=require
```

### Starting the Application

1. Start the development server:

```bash
npm run dev
```

### Initial Setup

After starting the server, you need to:

1. Register a user account:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'
```

2. Log in with your credentials:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'
```

After logging in, you'll be able to create threads and interact with the forum.

### Environment Variables

Required environment variables (should be in `.env` file):

- `DATABASE_URL`: PostgreSQL connection string

### Troubleshooting

If you encounter errors about missing tables or foreign key constraints:

1. Make sure you've run `npm run db:push` to create all database tables
2. Make sure you've initialized the categories using the SQL command above
3. Make sure you've registered and logged in before trying to create threads

# 3 Punch Convo

An MMA community forum app with Clerk authentication.

## Setting Up Authentication with Clerk

This application uses Clerk for authentication. Follow these steps to set it up:

1. **Create a Clerk account**:

   - Go to [clerk.com](https://clerk.com) and sign up for an account
   - Create a new application in your Clerk dashboard

2. **Configure your Clerk application**:

   - Set up the authentication methods you want to support (email/password, social logins, etc.)
   - Configure your application's URLs (add your app's domain)
   - In your Clerk application settings, find your API keys

3. **Set up environment variables**:

   - Create a `.env` file in the root directory of this project
   - Add the following environment variables:

   ```
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```

4. **Install dependencies**:

   ```bash
   npm install
   ```

5. **Run the application**:
   ```bash
   npm run dev
   ```

## API Authentication and Token Management

### Getting Your Clerk Token

To make authenticated API requests, you'll need your Clerk token. Here's how to get it:

#### How to get your initial token:

1. **Open your app in the browser** and log in
2. **Open Developer Tools** (F12)
3. **Go to Network tab**
4. **Make any request** (like viewing your profile)
5. **Find the request** and copy the `Authorization: Bearer <token>` header
6. **Use that token** in your reqs

### Using the Token for API Requests

Once you have your token, you can use it for authenticated API requests. Here are some common examples:

#### Update User Role

```bash
curl -X PUT http://localhost:5001/api/users/USER_ID/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "role": "ADMIN",
    "updatedBy": "your_user_id"
  }'
```

**Valid roles:** `ADMIN`, `MODERATOR`, `FIGHTER`, `USER`, `PREMIUM_USER`, `INDUSTRY_PROFESSIONAL`

#### Create a Thread

```bash
curl -X POST http://localhost:5001/api/threads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "title": "Your thread title",
    "content": "Your thread content",
    "categoryId": "ufc",
    "userId": "your_clerk_user_id"
  }'
```

#### Get User Information

```bash
curl -X GET http://localhost:5001/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

#### Get Notifications

```bash
curl -X GET http://localhost:5001/api/notifications \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

### Important Notes

- **Token Security**: Keep your token secure and don't share it publicly
- **Token Expiration**: Tokens expire based on your Clerk session settings
- **Authentication Required**: Most API endpoints require authentication
- **Role-based Access**: Some endpoints require specific user roles (e.g., only admins can update user roles)

## Development

This is a full-stack application with:

- React frontend with Clerk authentication
- Express backend with Clerk middleware for API protection
- Database integration for user data

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database connection
DATABASE_URL=postgres://postgres:postgres@localhost:5432/threepunchconvo

# Clerk authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Railway Volume configuration for file uploads
RAILWAY_VOLUME_MOUNT_PATH=/data  # Set by Railway automatically when volume is attached
RAILWAY_PUBLIC_DOMAIN=your-app.railway.app  # Your Railway app domain

# Server configuration
PORT=5000
NODE_ENV=development
```

# Database Migrations

The application uses two types of migrations:

## SQL Migrations

Located in the `/migrations` directory, these are raw SQL files that can be run directly against your PostgreSQL database.

```bash
# Run a specific SQL migration file
psql -d your_database_name -f migrations/000_create_categories_table.sql

# Or if using a connection string
psql "your_connection_string" -f migrations/000_create_categories_table.sql
```

## TypeScript Migrations

Located in the `/server/migrations` directory, these are programmatic migrations that use Drizzle ORM and are run through the migrate script.

```bash
# Run all TypeScript migrations
npm run migrate
```

### Migration Sequence

When setting up a new database from scratch, follow this sequence:

1. Run the SQL migration to create basic tables:

   ```bash
   psql "your_connection_string" -f migrations/000_create_categories_table.sql
   ```

2. Run the TypeScript migrations which will handle all other table creation and data initialization:
   ```bash
   npm run migrate
   ```

### Troubleshooting Migrations

If you encounter errors during migration:

1. **"relation does not exist"**: This usually means you're trying to reference a table that hasn't been created yet. Make sure to run migrations in the correct order.

2. **Foreign key constraint failures**: Ensure you've created all required tables before adding foreign key constraints.

3. **Duplicate key violations**: This could happen if you try to insert data that already exists. Use `ON CONFLICT DO NOTHING` in your SQL statements to handle this.

