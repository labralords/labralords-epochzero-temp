import path from 'node:path';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import hapiPino from 'hapi-pino';

dotenv.config({ path: path.join(__dirname, '../../../', '.env') });

/* eslint-disable import/first, import/order */
import { ApolloServer, ApolloServerPluginStopHapiServer } from 'apollo-server-hapi';
import { IExecutableSchemaDefinition } from '@graphql-tools/schema';
import Hapi from '@hapi/hapi';
import { typeDefinitions } from './graphql/typeDefinitions';
import { resolvers as resolverDefinitions } from './graphql/resolvers';
import * as routeScopes from './routes';
import config from 'config';
import { accessJwtSecret } from './shared/jwt';
/* eslint-enable import/first, import/order */

const environment = process.env.NODE_ENV || 'development';

const port = Number.parseInt(config.get('http.port'), 10);
const host: string = config.get('http.host');
const corsOrigin: string[] = config.get<string[]>('cors');
const domain: string = config.get<string>('domain');

const cors: Hapi.RouteOptionsCors = {
  origin: corsOrigin,
  additionalHeaders: ['Cookie', 'cache-control', 'x-requested-with', 'Accept-language', 'Authorization'],
  credentials: true,
};

async function startApolloServer(
  typeDefs: IExecutableSchemaDefinition['typeDefs'],
  resolvers: IExecutableSchemaDefinition['resolvers'],
) {
  const app = Hapi.server({
    port,
    host,
    routes: {
      json: {
        space: 2,
      },
      cors,
    },
  });

  app.register({
    plugin: hapiPino,
    options: {
      redact: ['req.headers.authorization'],
    },
  });

  app.route({
    method: 'GET',
    path: '/healthz',
    handler: () => 'OK',
  });

  app.state('rft', {
    ttl: 1000 * 60 * 60 * 24 * 90,
    isSecure: true,
    isHttpOnly: true,
    clearInvalid: false,
    strictHeader: true,
    isSameSite: 'None',
    path: '/',
    domain: domain || '127.0.0.1',
  });

  const routes = Object.values(routeScopes).flatMap(
    (r) => Object.values(r).filter((v) => typeof v === 'object') as Hapi.ServerRoute[],
  );

  for (const route of routes) {
    app.route(route);
  }

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: true,
    cache: 'bounded',
    plugins: [ApolloServerPluginStopHapiServer({ hapiServer: app })],
    introspection: process.env.NODE_ENV !== 'production',
    context: async ({ request }) => {
      const accessToken = request?.headers?.authorization?.replace('Bearer ', '') || '';
      try {
        const payload = jwt.verify(accessToken, accessJwtSecret) as { eth_address: string; access: boolean };
        return { user: { eth_address: payload?.eth_address, access: payload?.access } };
      } catch (error) {
        request?.logger?.error(`GraphQL Auth Error: ${error.message}`);
        if (error instanceof jwt.JsonWebTokenError) {
          return { user: null };
        }
        return { user: null };
      }
    },
  });

  await server.start();
  await server.applyMiddleware({
    app,
    cors,
  });
  await app.start();
  app.logger.info(`Current environment ${environment}`);
  app.logger.info('Server running on %s', app.info.uri);
}

const init = async () => {
  await startApolloServer(typeDefinitions, resolverDefinitions);
};

process.on('unhandledRejection', (error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});

process.on('SIGINT', () => {
  process.exit();
});

init();
