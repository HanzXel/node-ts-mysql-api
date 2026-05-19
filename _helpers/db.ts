import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';

// Use environment variables in production, fallback to config.json locally
let config: any;
try {
  config = require('../config.json');
} catch {
  config = {};
}

const dbHost     = process.env.DB_HOST     || config.database?.host     || 'localhost';
const dbPort     = parseInt(process.env.DB_PORT || String(config.database?.port || 3306));
const dbUser     = process.env.DB_USER     || config.database?.user     || 'root';
const dbPassword = process.env.DB_PASSWORD || config.database?.password || '';
const dbName     = process.env.DB_NAME     || config.database?.database || 'node_boilerplate';

export const db: any = {};

export async function initialize() {
  // Create DB if it doesn't exist (skip on PlanetScale/managed DBs)
  try {
    const connection = await mysql2.createConnection({
      host: dbHost, port: dbPort, user: dbUser, password: dbPassword
    }).promise();
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();
  } catch (err: any) {
    // Managed DB hosts (e.g. Aiven, PlanetScale) may not allow CREATE DATABASE — that's fine
    console.warn('⚠️  Could not auto-create database (this is normal on managed hosts):', err.message);
  }

  // Connect with Sequelize
  const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: false,
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: { rejectUnauthorized: false }
    } : {}
  });

  db.sequelize = sequelize;

  // Import models
  db.Account = (await import('../accounts/account.model')).accountModel(sequelize);
  db.RefreshToken = (await import('../accounts/refresh-token.model')).refreshTokenModel(sequelize);

  // Relationships
  db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
  db.RefreshToken.belongsTo(db.Account);

  // Sync tables
  await sequelize.sync();
}
