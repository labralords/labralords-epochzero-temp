import postgres from 'postgres';
import config from 'config';

const port = Number.parseInt(config.get('db.port'), 10);
const host: string = config.get('db.host');
const database: string = config.get('db.database');
const user: string = config.get('db.username');
const password: string = config.get('db.password');
const ssl: boolean | object | 'require' | 'allow' | 'prefer' | 'verify-full' = config.get('db.ssl');

console.log('Connecting to database', { host, port, database, user });

export const sql = postgres({
  host,
  port,
  database,
  user,
  password,
  ssl,
  transform: {
    // column: postgres.toCamel,
  },
});

export default {
  sql,
};
