# ThreePunchConvo

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

# AWS S3 configuration for file uploads
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your-bucket-name
CDN_BASE_URL=https://your-bucket-name.s3.amazonaws.com

# Server configuration
PORT=5000
NODE_ENV=development
```
