import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../../', '.env') });

/* eslint-disable import/first, import/order */
import { wait } from '@labralords/common';
import Hapi from '@hapi/hapi';
import config from 'config';
import { SoonaverseRepository } from '@labralords/thirdparty';
import { cursors } from '@labralords/database';
/* eslint-enable import/first, import/order */

const port = Number.parseInt(config.get('http.port'), 10);
const host: string = config.get('http.host');

const scrape = async () => {
  const repositories = [new SoonaverseRepository({ requestTimeout: 15_000 })];

  for (const repository of repositories) {
    try {
      console.log(`Fetching members for ${repository.name}`);
      const cursor1 = await cursors.getCursor(repository.name, 'members');
      console.log(`Cursor ref for ${repository.name} is`, cursor1?.ref);
      await repository.fetchMembers({ ref: cursor1 ? cursor1?.ref : '', name: 'members' });

      console.log(`Fetching member updates for ${repository.name}`);
      const cursor2 = await cursors.getCursor(repository.name, 'member-updates');
      console.log(`Cursor ref for ${repository.name} is`, cursor2?.ref);
      await repository.fetchMembers({
        ref: cursor2 ? cursor2?.ref : new Date(0).toISOString(),
        name: 'member-updates',
      });
      console.log(`Finished fetching members for ${repository.name}`);
    } catch (error) {
      console.error(error);
    }
  }

  await wait(1000);
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
