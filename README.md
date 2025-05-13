# ThreePunchConvo

MVP -- not working, purely for demo purposes

## Getting Started

### Prerequisites

- Node.js
- npm
- PostgreSQL (for local development)

### Database Setup

There are two options for setting up the database:

#### Option 1: Local PostgreSQL (Recommended for Development)

1. Install PostgreSQL 14:
```bash
brew install postgresql@14
```

2. Start PostgreSQL service:
```bash
brew services start postgresql@14
```

3. Create a new database:
```bash
createdb threepunchconvo
```

4. Create a `.env` file in the project root and add:
```bash
DATABASE_URL=postgres://localhost:5432/threepunchconvo
```

#### Option 2: Neon (Cloud Hosted)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy your connection string from the dashboard
4. Add it to your `.env` file:
```bash
DATABASE_URL=your_neon_connection_string
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run database migrations:
```bash
npm run db:push
```

3. Start the development server:
```bash
npm run dev
```

### Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
