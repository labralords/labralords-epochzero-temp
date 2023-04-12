import _ from 'lodash';
import { UserDatabaseEntry } from '../contracts/database';
import { sql } from './client';

export const tableName = 'users';

export const fetchColumns: (keyof UserDatabaseEntry)[] = [
  'id',
  'source',
  'eth_address',
  'iota_address',
  'smr_address',
  'username',
  'about',
  'twitter',
  'discord',
  'github',
  'access',
  'nonce',
];

export const updateColumns: (keyof UserDatabaseEntry)[] = fetchColumns.filter(
  (column) => !['id', 'nonce'].includes(column),
);

export const upsertColumns: (keyof UserDatabaseEntry)[] = updateColumns;

export const getUserByEthAddress = async (ethAddress: string): Promise<UserDatabaseEntry> => {
  const users = await sql<UserDatabaseEntry[]>`
    select
      ${sql(fetchColumns)}
    from ${sql(tableName)}
    where eth_address = ${ethAddress?.toLowerCase()}
  `;
  return users?.[0] || null;
};

export const getUserById = async (id: string): Promise<UserDatabaseEntry> => {
  const users = await sql<UserDatabaseEntry[]>`
    select
      ${sql(fetchColumns)}
    from ${sql(tableName)}
    where id = ${id}
  `;
  return users?.[0] || null;
};

export const getNonceByEthAddress = async (ethAddress: string): Promise<string> => {
  const users = await sql<UserDatabaseEntry[]>`
    select
      nonce
    from ${sql(tableName)}
    where eth_address = ${ethAddress?.toLowerCase()}
    and access = true
  `;
  return users?.[0]?.nonce || null;
};

export const updateNonce = async (ethAddress: string, nonce: string): Promise<string> => {
  const users = await sql<UserDatabaseEntry[]>`
    update ${sql(tableName)}
    set nonce = ${nonce}
    where eth_address = ${ethAddress?.toLowerCase()}
    returning nonce
  `;
  return users?.[0]?.nonce || null;
};

export const updateAccess = async (ethAddresses: string[]): Promise<UserDatabaseEntry[]> => {
  const uniqueAddresses = _.uniq(ethAddresses);
  const hasAccess = await sql<UserDatabaseEntry[]>`
    insert into ${sql(tableName)} ${sql(
    uniqueAddresses.map((ethAddress) => ({
      access: true,
      eth_address: ethAddress?.toLowerCase(),
      iota_address: null,
      username: null,
    })) as UserDatabaseEntry[],
    ...upsertColumns,
  )}
    on conflict (eth_address) do update
    set
      access = true
    returning ${sql(fetchColumns)}
  `;

  await sql`
    update ${sql(tableName)}
    set
      access = false
    where eth_address not in ${sql(uniqueAddresses)}
  `;

  return hasAccess;
};

export const upsertMemberBatch = async (members: UserDatabaseEntry[]): Promise<UserDatabaseEntry[]> => {
  const uniqueMembers = _.uniqBy(members, 'eth_address');
  const columns = upsertColumns.filter((column) => column !== 'access');
  const updatedMembers = await sql<UserDatabaseEntry[]>`
    insert into ${sql(tableName)} ${sql(
    uniqueMembers as UserDatabaseEntry[],
    ...columns.filter((column) => column !== 'access'),
  )}
    on conflict (eth_address) do update
    set
      iota_address = excluded.iota_address,
      smr_address = excluded.smr_address,
      username = excluded.username,
      about = excluded.about,
      twitter = excluded.twitter,
      discord = excluded.discord,
      github = excluded.github
    returning ${sql(fetchColumns)}
  `;
  return updatedMembers;
};
