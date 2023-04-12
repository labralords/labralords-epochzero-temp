import _ from 'lodash';
import { CursorDatabaseEntry } from '../contracts';
import { sql } from './client';

export const tableName = 'cursors';

export const getCursor = async (service: string, type: string): Promise<CursorDatabaseEntry> => {
  try {
    const cursors = await sql<CursorDatabaseEntry[]>`
      select
        *
      from ${sql(tableName)}
      where
        service = ${service}
        and type = ${type}
    `;
    return cursors?.[0] || null;
  } catch (error) {
    console.error(`Failed to get batch: ${error}`);
    return null;
  }
};

export const updateCursor = async (service: string, type: string, reference: string): Promise<void> => {
  if (!reference) {
    return;
  }

  const cursor = {
    service,
    type,
    ref: reference,
  };
  try {
    await sql`
      insert into ${sql(tableName)} ${sql(cursor, 'service', 'type', 'ref')}
      on conflict (service, type) do update set ref=excluded.ref
    `;
  } catch (error) {
    throw new Error(`Failed to set cursor: ${error}`);
  }
};
