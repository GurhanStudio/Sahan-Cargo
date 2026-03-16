require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixColumn() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('Connected to DB');

  // Get FK constraint name
  const [constraints] = await conn.query(`
    SELECT CONSTRAINT_NAME 
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
      AND TABLE_NAME = 'cargo_checkpoints' 
      AND COLUMN_NAME = 'checked_by_user_id'
      AND REFERENCED_TABLE_NAME = 'users'
  `);

  console.log('Found constraints:', constraints);

  for (const c of constraints) {
    await conn.query(`ALTER TABLE cargo_checkpoints DROP FOREIGN KEY \`${c.CONSTRAINT_NAME}\``);
    console.log('Dropped FK:', c.CONSTRAINT_NAME);
  }

  // Alter the column to allow NULL
  await conn.query('ALTER TABLE cargo_checkpoints MODIFY COLUMN checked_by_user_id INT NULL');
  console.log('Column altered: checked_by_user_id is now NULL-able');

  // Re-add FK (nullable, with ON DELETE SET NULL)
  await conn.query(`
    ALTER TABLE cargo_checkpoints 
    ADD CONSTRAINT fk_checkpoint_user 
    FOREIGN KEY (checked_by_user_id) REFERENCES users(id) 
    ON DELETE SET NULL ON UPDATE CASCADE
  `);
  console.log('FK re-added with ON DELETE SET NULL');

  await conn.end();
  console.log('Done!');
}

fixColumn().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
