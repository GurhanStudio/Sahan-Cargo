require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function seed() {
  try {
    // Step 1: Create database if not exists (raw connection without specifying DB)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    await connection.end();
    console.log(`✅ Database "${process.env.DB_NAME}" ensured.`);

    // Step 2: Now require models (which connect to the DB)
    const { sequelize, Office, User } = require('./models');
    await sequelize.authenticate();
    console.log('✅ Database connected.');

    // Sync tables
    await sequelize.sync({ force: true });
    console.log('✅ Tables created.');

    // ── Seed Offices ──
    const offices = await Office.bulkCreate([
      { office_name: 'Mogadishu Origin Office', office_type: 'ORIGIN_OFFICE', location: 'Mogadishu' },
      { office_name: 'Mogadishu Airport Cargo', office_type: 'AIRPORT_CARGO', location: 'Aden Abdulle International Airport' },
      { office_name: 'Hargeisa Airport', office_type: 'DESTINATION_AIRPORT', location: 'Egal International Airport, Hargeisa' },
      { office_name: 'Hargeisa Delivery Office', office_type: 'DESTINATION_OFFICE', location: 'Hargeisa' },
      { office_name: 'Garowe Origin Office', office_type: 'ORIGIN_OFFICE', location: 'Garowe' },
      { office_name: 'Bosaso Airport', office_type: 'AIRPORT_CARGO', location: 'Bender Qassim Airport, Bosaso' },
    ]);
    console.log(`✅ ${offices.length} offices created.`);

    // ── Seed Users ──
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const staffPassword = await bcrypt.hash('staff123', 10);

    const users = await User.bulkCreate([
      {
        name: 'System Admin',
        email: 'admin@sahancargo.com',
        phone: '0612345678',
        password: hashedPassword,
        role: 'ADMIN',
        office_id: null
      },
      {
        name: 'Ahmed Origin Staff',
        email: 'ahmed@sahancargo.com',
        phone: '0612345679',
        password: staffPassword,
        role: 'ORIGIN_OFFICE',
        office_id: offices[0].id
      },
      {
        name: 'Fatima Airport Staff',
        email: 'fatima@sahancargo.com',
        phone: '0612345680',
        password: staffPassword,
        role: 'AIRPORT_CARGO',
        office_id: offices[1].id
      },
      {
        name: 'Hassan Dest Airport',
        email: 'hassan@sahancargo.com',
        phone: '0612345681',
        password: staffPassword,
        role: 'DESTINATION_AIRPORT',
        office_id: offices[2].id
      },
      {
        name: 'Amina Dest Office',
        email: 'amina@sahancargo.com',
        phone: '0612345682',
        password: staffPassword,
        role: 'DESTINATION_OFFICE',
        office_id: offices[3].id
      }
    ]);
    console.log(`✅ ${users.length} users created.`);

    console.log('\n═══════════════════════════════════════');
    console.log('  SEED COMPLETE — Login Credentials:');
    console.log('═══════════════════════════════════════');
    console.log('  Admin:  admin@sahancargo.com / admin123');
    console.log('  Staff:  ahmed@sahancargo.com / staff123');
    console.log('          fatima@sahancargo.com / staff123');
    console.log('          hassan@sahancargo.com / staff123');
    console.log('          amina@sahancargo.com / staff123');
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
