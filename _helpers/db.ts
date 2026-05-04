import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';
const config = require('../config.json');

export const db: any = {};

export async function initialize() {
  const { host, port, user, password, database } = config.database;

  // Create DB if it doesn't exist
  const connection = await mysql2.createConnection({ host, port, user, password }).promise();
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
  await connection.end();

  // Connect with Sequelize
  const sequelize = new Sequelize(database, user, password, {
    host,
    dialect: 'mysql',
    logging: false
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