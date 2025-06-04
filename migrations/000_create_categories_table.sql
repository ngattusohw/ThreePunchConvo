-- Create the categories table required for the JS/TS migrations
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0
);

-- Create an index for better query performance
CREATE INDEX IF EXISTS idx_categories_id ON categories(id); 