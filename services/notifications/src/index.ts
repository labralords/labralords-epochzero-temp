import path from 'node:path';
import dotenv from 'dotenv';
import _ from 'lodash';

dotenv.config({ path: path.join(__dirname, '../../../', '.env') });

/* eslint-disable import/first, import/order */
import { wait } from '@labralords/common';
import { NotificationDatabaseEntry, notifications } from '@labralords/database';
import Hapi from '@hapi/hapi';
import config from 'config';
/* eslint-enable import/first, import/order */

const port = Number.parseInt(config.get('http.port'), 10);
const host: string = config.get('http.host');

const scrape = async () => {
  try {
    console.log(`Fetch notification queue`);
    const queue = await notifications.getSoldNotificationQueue();

    if (queue.length === 0) {
      console.log(`No items in queue`);
      return;
    }
    console.log(`Found ${queue.length} notifications in queue`);
    const notificationItems = queue.map(
      (item): NotificationDatabaseEntry => ({
        user_id: item.sold_by_id,
        notify_type: item.notify_type,
        created_at: item.created_at,
        context: {
          name: item.name,
          rank: item.rank,
          media_url: item.media_url,
          network: item.network,
          sale_price: item.sale_price,
          sold_to_username: item.sold_to_username,
          sold_to_address: item.sold_to_address,
        },
        notified: false,
        notified_at: null,
        notify_item_id: item.notify_item_id,
        acknowledged: false,
      }),
    );

    await notifications.batchInsertNotifications(notificationItems);
    await notifications.deleteSoldNotificationQueue(queue);
  } catch (error) {
    console.error(error);
  } finally {
    await wait(1000);
  }
};

const main = async () => {
  const app = Hapi.server({
    port,
    host,
    routes: {
      json: {
        space: 2,
      },
    },
  });
  app.route({
    method: 'GET',
    path: '/healthz',
    handler: () => 'OK',
  });
  await app.start();
  console.log('Server running on %s', app.info.uri);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await scrape();
    } catch (error) {
      console.error(`Failed to scrape: ${error}`);
    }
    await wait(1000);
  }
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
});
