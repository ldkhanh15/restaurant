import { Sequelize } from 'sequelize';
import { env } from './index';

export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.pass, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  timezone: '+00:00',
  logging: env.nodeEnv === 'development' ? console.log : false
});
