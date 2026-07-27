const db = require("./db");

const sql = "ALTER TABLE sales ADD COLUMN customer_name VARCHAR(255) NULL;";

db.query(sql, (err) => {
  if (err) {
    console.error("Error adding column:", err);
  } else {
    console.log("✅ customer_name column added to sales table");
  }
  process.exit(0);
});
