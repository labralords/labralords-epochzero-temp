import path from 'node:path';
import dotenv from 'dotenv';
import _ from 'lodash';
import { SoonaverseRepository } from '@labralords/thirdparty';

dotenv.config({ path: path.join(__dirname, '../../../', '.env') });

/* eslint-disable import/first, import/order */
import { wait } from '@labralords/common';
import { users } from '@labralords/database';
import Hapi from '@hapi/hapi';
import config from 'config';
/* eslint-enable import/first, import/order */

const port = Number.parseInt(config.get('http.port'), 10);
const host: string = config.get('http.host');

const scrape = async () => {
  try {
    console.log(`Fetching access for labralords.com`);
    const soonaverse = new SoonaverseRepository({ requestTimeout: 15_000 });
    const uniqueAddresses: string[] = await soonaverse.getLabralordsMemberAddresses();

    if (uniqueAddresses?.length > 0) {
      console.log(`Number of unique addresses with access: ${uniqueAddresses.length}`);
      await users.updateAccess(uniqueAddresses);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await wait(15_000);
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
