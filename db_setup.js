const sqlite3 = require('sqlite3').verbose();

// Create a new SQLite database file
const db = new sqlite3.Database('./trend_request_form.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Define the schema for the users table
db.serialize(() => {
  // Check if the users table exists and has the correct schema
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
    if (err) {
      console.error('Error checking for users table:', err.message);
      return;
    }

    if (!row) {
      // If the users table doesn't exist, create it with the correct schema
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fullName TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          bigoId TEXT NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user'
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err.message);
        } else {
          console.log('Users table created successfully.');
        }
        closeDatabase();
      });
    } else {
      // Check if the 'role' column exists
      db.all("PRAGMA table_info(users);", (err, columns) => {
        if (err) {
          console.error('Error fetching table info:', err.message);
          closeDatabase();
          return;
        }

        const roleColumnExists = columns.some(column => column.name === 'role');
        if (!roleColumnExists) {
          // Create a new table with the correct schema
          db.run(`
            CREATE TABLE users_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              fullName TEXT NOT NULL,
              email TEXT NOT NULL UNIQUE,
              bigoId TEXT NOT NULL,
              password TEXT NOT NULL,
              role TEXT NOT NULL DEFAULT 'user'
            )
          `, (err) => {
            if (err) {
              console.error('Error creating new users table:', err.message);
              closeDatabase();
            } else {
              // Migrate data from the old table to the new one
              db.run(`
                INSERT INTO users_new (id, fullName, email, bigoId, password)
                SELECT id, fullName, email, bigoId, password FROM users
              `, (err) => {
                if (err) {
                  console.error('Error migrating data:', err.message);
                  closeDatabase();
                } else {
                  // Drop the old table and rename the new one
                  db.run(`
                    DROP TABLE users;
                    ALTER TABLE users_new RENAME TO users;
                  `, (err) => {
                    if (err) {
                      console.error('Error finalizing table migration:', err.message);
                    } else {
                      console.log('Users table updated successfully with new schema.');
                    }
                    closeDatabase();
                  });
                }
              });
            }
          });
        } else {
          console.log('Users table already has the correct schema.');
          closeDatabase();
        }
      });
    }
  });
});

function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
}
