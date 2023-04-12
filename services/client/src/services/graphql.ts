import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core';
import { setClient } from 'svelte-apollo';
import _ from 'lodash';
import { setContext } from '@apollo/client/link/context';
import { PUBLIC_API_URL } from '../constants';
import { silentlyAuthenticateUser } from './auth';

export const initializeGraphqlClient = () => {
  const httpLink = createHttpLink({
    uri: `${PUBLIC_API_URL}/graphql`,
    credentials: 'include',
  });

  silentlyAuthenticateUser().catch((error) => console.error(error));

  const authLink = setContext(async (__, { headers }) => {
    try {
      const accessToken = await silentlyAuthenticateUser();
      return {
        headers: {
          ...headers,
          authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
      };
    } catch (error) {
      console.error(error);
      return {
        headers,
      };
    }
  });

  const client = new ApolloClient({
    // eslint-disable-next-line unicorn/prefer-spread
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });

  setClient(client);
};

export default initializeGraphqlClient;
