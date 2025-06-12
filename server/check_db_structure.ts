import { pool } from "./db";

async function checkDatabaseStructure() {
  try {
    console.log("Checking database structure...");
    
    // Check all columns in threads table
    const allColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'threads'
      ORDER BY column_name
    `;
    
    const allColumnsResult = await pool.query(allColumnsQuery);
    
    console.log("\nAll columns in threads table:");
    allColumnsResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.column_name}`);
    });
    
    // Check if threads table actually has data
    const countQuery = `SELECT COUNT(*) FROM threads`;
    const countResult = await pool.query(countQuery);
    console.log(`\nNumber of threads in database: ${countResult.rows[0].count}`);
    
    // Check the database name
    const dbNameQuery = `SELECT current_database()`;
    const dbNameResult = await pool.query(dbNameQuery);
    console.log(`\nCurrent database: ${dbNameResult.rows[0].current_database}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error checking database structure:", error);
    process.exit(1);
  } finally {
    // Close pool
    await pool.end();
  }
}

checkDatabaseStructure(); 