import _ from 'lodash';
import { UserToken } from '../contracts/database';
import { sql } from './client';

export const tableName = 'tokens';

export const fetchColumns: (keyof UserToken)[] = [
  'id',
  'user_id',
  'token',
  'family',
  'browser_info',
  'expires_at',
  'created_at',
];

export const updateColumns: (keyof UserToken)[] = fetchColumns.filter(
  (column) => !['id', 'created_at'].includes(column),
);

export const saveRefreshToken = async (tokenData: UserToken): Promise<UserToken> => {
  const userTokenResponse = await sql<UserToken[]>`
    insert into ${sql(tableName)} ${sql(tokenData, ...updateColumns)}
    returning ${sql(fetchColumns)}
  `;
  return userTokenResponse?.[0] || null;
};

export const deleteUserTokenFamily = async (userId: string, tokenFamily: string): Promise<void> => {
  await sql`
    delete from ${sql(tableName)}
    where user_id = ${userId} and family = ${tokenFamily}
  `;
};

export const fetchUserTokens = async (userId: string, token: string): Promise<UserToken[]> => {
  const userTokenResponse = await sql<UserToken[]>`
    select ${sql(fetchColumns)}
    from ${sql(tableName)}
    where user_id = ${userId} and token = ${token}
  `;
  return userTokenResponse || [];
};

export const deleteUserToken = async (token: string): Promise<void> => {
  await sql`
    delete from ${sql(tableName)}
    where token = ${token}
  `;
};

export const logout = async (refreshToken: string) => {
  await deleteUserToken(refreshToken);
};

export const logoutAll = async (userId: string) => {
  await sql`
    delete from ${sql(tableName)}
    where user_id = ${userId}
  `;
};
