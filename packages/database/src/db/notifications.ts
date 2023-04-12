import _ from 'lodash';
import { sql } from './client';

import { ItemSoldNotificationQueueItem, NotificationDatabaseEntry } from '../contracts';

export const getSoldNotificationQueue = async (): Promise<ItemSoldNotificationQueueItem[]> => {
  return sql<ItemSoldNotificationQueueItem[]>`
    select
      i.id as notify_item_id,
      q.id as queue_id,
      n.name as name,
      n.rank as rank,
      n.media_url as media_url,
      n.network as network,
      q.old_value->>'current_price' as sale_price,
      i.item_type as notify_type,
      old_user.eth_address as sold_by_address,
      old_user.id as sold_by_id,
      new_user.username as sold_to_username,
      new_user.eth_address as sold_to_address,
      q.created_at as created_at
    from notify_queue as q
    join notify_items as i on q.notify_item_id = i.id and i.item_type = 'item_sold'
    join nfts as n on n.id = i.item_id::uuid
    join users as new_user on new_user.eth_address = q.new_value->>'owner_address'::text
    join users as old_user on old_user.eth_address = q.old_value->>'owner_address'::text
    order by q.created_at asc
  `;
};

export const batchInsertNotifications = async (
  notifications: NotificationDatabaseEntry[],
): Promise<NotificationDatabaseEntry[]> => {
  return sql`
    insert into notifications ${sql(
      notifications,
      'user_id',
      'notify_item_id',
      'notify_type',
      'context',
      'notified',
      'notified_at',
      'created_at',
    )}
    on conflict (user_id, notify_item_id, created_at) do nothing
  `;
};

export const deleteSoldNotificationQueue = async (queue: ItemSoldNotificationQueueItem[]): Promise<void> => {
  const ids = queue.map((item) => item.queue_id);
  await sql`
    delete from notify_queue where id in ${sql(ids)}
  `;
};

export const getNotifications = async (
  address: string,
  offset = 0,
  limit = 10,
): Promise<NotificationDatabaseEntry[]> => {
  return sql<NotificationDatabaseEntry[]>`
    select
      n.id as id,
      n.user_id as user_id,
      n.notify_item_id as notify_item_id,
      n.notify_type as notify_type,
      n.context as context,
      n.notified as notified,
      n.notified_at as notified_at,
      n.created_at as created_at
    from notifications as n
    join users as u on u.id = n.user_id
    where u.eth_address = ${address}
    order by n.created_at desc
    limit ${limit}
    offset ${offset}
  `;
};

export const countNotifications = async (address: string): Promise<number> => {
  const result = await sql<{ count: number }[]>`
    select count(*) as count
    from notifications as n
    join users as u on u.id = n.user_id
    where u.eth_address = ${address}
  `;
  return result[0]?.count || 0;
};

export const acknowledgeNotifications = async (address: string, ids: string[]): Promise<void> => {
  await sql`
    update notifications
    set acknowledged = true
    where id in ${sql(ids)}
    and user_id = (select id from users where eth_address = ${address})
  `;
};
