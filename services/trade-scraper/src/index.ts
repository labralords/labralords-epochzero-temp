import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../../', '.env') });

/* eslint-disable import/first, import/order */
import { cursors } from '@labralords/database';
import { promiseTimeout, wait } from '@labralords/common';
import Hapi from '@hapi/hapi';
import config from 'config';
import _ from 'lodash';
import { SoonaverseRepository } from '@labralords/thirdparty';
/* eslint-enable import/first, import/order */

const requestTimeout = 1000 * 15;
const port = Number.parseInt(config.get('http.port'), 10);
const host: string = config.get('http.host');

const logger = {
  error: (...messages: string[]) => console.error(...messages),
  info: (...messages: string[]) => console.info(...messages),
  warn: (...messages: string[]) => console.warn(...messages),
};

// for each collection batch
//   1. Fetch all new trades
//   2. get all nft_ids from trades
//   3. get all nfts from nft_ids
//   4. fetch missing nft data and insert into nft table
//   5. merge id dictionary with nft data
//   5. insert trades into sales table

const scrape = async () => {
  const repositories = [new SoonaverseRepository({ requestTimeout })];

  // TODO: make cursor stored in DB
  for (const repository of repositories) {
    try {
      logger.info(`Fetching trades for ${repository.name}`);
      const cursor1 = await promiseTimeout(cursors.getCursor(repository.name, 'trades'), requestTimeout);
      logger.info(`Cursor ref for ${repository.name} is`, cursor1?.ref);
      await repository.fetchTrades({ ref: cursor1 ? cursor1?.ref : '', name: 'trades' });

      logger.info(`Fetching trade updates for ${repository.name}`);
      const cursor2 = await promiseTimeout(cursors.getCursor(repository.name, 'trade-updates'), requestTimeout);
      logger.info(`Cursor ref for ${repository.name} is`, cursor2?.ref);
      await repository.fetchTrades({ ref: cursor2 ? cursor2?.ref : new Date(0).toISOString(), name: 'trade-updates' });
      logger.info(`Finished fetching trades for ${repository.name}`);
    } catch (error) {
      logger.error(error);
    }
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
  logger.info('Server running on %s', app.info.uri);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await scrape();
    } catch (error) {
      logger.error(`Failed to scrape: ${error}`);
    }
    await wait(1000);
  }
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  logger.error(error);
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
});
