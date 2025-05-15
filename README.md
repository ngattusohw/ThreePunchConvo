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

4. Run database migrations:
```bash
npm run db:push
```

5. Initialize forum categories:
```bash
psql -d threepunchconvo -c "INSERT INTO categories (id, name, description, count) VALUES 
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
3. Copy your connection string from the dashboard
4. Add it to your `.env` file:
```bash
DATABASE_URL=your_neon_connection_string
```

5. Install project dependencies:
```bash
npm install
```

6. Run database migrations:
```bash
npm run db:push
```

7. Initialize forum categories (replace `your_neon_connection_string` with your actual connection string):
```bash
psql "your_neon_connection_string" -c "INSERT INTO categories (id, name, description, count) VALUES 
('ufc', 'UFC', 'Ultimate Fighting Championship discussions', 0),
('general', 'General', 'General MMA discussions', 0),
('boxing', 'Boxing', 'Boxing discussions', 0),
('bellator', 'Bellator', 'Bellator MMA discussions', 0),
('pfl', 'PFL', 'Professional Fighters League discussions', 0),
('one', 'ONE', 'ONE Championship discussions', 0);"
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
