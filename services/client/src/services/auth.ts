import _ from 'lodash';
import Web3 from 'web3';

import { authError, isAuthenticated } from '../store';
import { PUBLIC_API_URL } from '../constants';
import { isMetamask } from '../util';
import { addNotification } from './notifications';

const baseUrl = PUBLIC_API_URL;

let accessToken = '';

(window as any).ethereum?.on('accountsChanged', (_accounts: string[]) => {
  isAuthenticated.set(false);
});

export const handleSignMessage = (publicAddress: string, nonce: string) => {
  const { ethereum } = window as any;
  const web3 = new Web3(ethereum);
  return new Promise<string>((resolve, reject) => {
    web3.eth.personal.sign(nonce, publicAddress, '', (error, signature) => {
      if (error) return reject(error);
      return resolve(signature);
    });
  });
};

export const verifySignature = async (address: string, signature: string) => {
  const responseSign = await fetch(`${baseUrl}/auth/${address}/signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ signature }),
  });
  if (responseSign.status === 200) {
    const { data } = await responseSign.json();
    accessToken = data?.accessToken;
    isAuthenticated.set(true);
  }
};

export const setPublicAddress = (publicAddress: string) => {
  localStorage.setItem('publicAddress', publicAddress);
};

export const getPulicAddress = () => {
  return localStorage.getItem('publicAddress');
};

export const isTokenExpired = (token: string) => {
  const [, payload] = token.split('.');
  const { exp } = JSON.parse(atob(payload));
  return exp * 1000 < Date.now();
};

export const getNonce = async (address: string) => {
  const responseNonce = await fetch(`${baseUrl}/auth/${address}/nonce`);
  const { data } = await responseNonce.json();
  return data?.nonce || null;
};

export const fetchAddress = async () => {
  const { ethereum } = window as any;
  const accounts = await ethereum?.request({ method: 'eth_requestAccounts' });
  const account = accounts[0];
  setPublicAddress(account);
  return account;
};

export const requestWalletPermissions = async () => {
  const { ethereum } = window as any;
  const recentAddress = getPulicAddress();

  if (!isMetamask && !recentAddress) {
    await ethereum.request({
      method: 'wallet_requestPermissions',
      params: [
        {
          eth_accounts: {
            recentAddress,
          },
        },
      ],
    });
  }
};

export const login = async () => {
  try {
    await requestWalletPermissions();
    const address = await fetchAddress();
    const nonce = await getNonce(address);
    if (!nonce) {
      addNotification({
        type: 'error',
        message: 'Make sure you own a Labralord NFT and that you have selected the correct wallet.',
        link: {
          text: 'Get our NFT here',
          href: 'https://soonaverse.com/collection/0x4254fba1c5e487b44f415072230f4148c6c03d1f',
          target: '_blank',
        },
      });
      authError.set({ type: 'nonceError' });
      setPublicAddress('');
      return;
    }
    const signature = await handleSignMessage(address, nonce);
    await verifySignature(address, signature);
    addNotification({
      type: 'success',
      message: 'Successfully connected',
    });
  } catch (error) {
    console.log(error);
    if (error.code === -32_002) {
      addNotification({
        type: 'error',
        message:
          'Metamask is already waiting for your confirmation. Please confirm the transaction. Maybe the popup window is minimized?',
      });
      return;
    }
    setPublicAddress('');
    addNotification({
      type: 'error',
      message: 'Something went wrong. Please try again. Refresh the page if the problem persists.',
    });
  }
};

export const silentlyAuthenticate = async () => {
  const token = accessToken;
  if (token && !isTokenExpired(token)) {
    isAuthenticated.set(true);
    return token;
  }

  const response = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'GET',
    credentials: 'include',
  });
  if (response.status === 200) {
    const { data } = await response.json();
    accessToken = data?.accessToken;
    isAuthenticated.set(true);
    return accessToken;
  }
  isAuthenticated.set(false);
  accessToken = '';
  return accessToken;
};

export const silentlyAuthenticateUser = _.throttle(silentlyAuthenticate, 1000);

export const logout = async () => {
  try {
    await fetch(`${baseUrl}/auth/logout`, {
      method: 'GET',
      credentials: 'include',
    });
  } catch (error) {
    console.error(error);
  } finally {
    accessToken = '';
    localStorage.setItem('publicAddress', '');
    isAuthenticated.set(false);
  }
};

const auth = {
  login,
  logout,
  silentlyAuthenticateUser,
  isTokenExpired,
};

export default auth;
