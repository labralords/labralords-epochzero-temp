import Hapi from '@hapi/hapi';
import Joi from 'joi';
import * as ethUtil from 'ethereumjs-util';
import Boom from '@hapi/boom';
import { v4 as uuidV4 } from 'uuid';
import { users } from '@labralords/database';
import { getBrowserInfo, refreshTokens, logout, generateAccessToken, createRefreshToken } from '../shared/jwt';

export const isConnected: Hapi.ServerRoute = {
  method: 'GET',
  path: '/auth/refresh',
  handler: async (request, h): Promise<Hapi.ResponseObject> => {
    try {
      const token = request?.state?.rft || '';
      const browserInfo = getBrowserInfo(request);
      const { accessToken, refreshToken, ethAddress } = await refreshTokens(token, browserInfo);
      return h
        .response({
          data: {
            success: true,
            accessToken,
            refreshToken,
            user: ethAddress,
            msg: 'Refresh successful',
          },
        })
        .state('rft', refreshToken)
        .code(200);
    } catch (error) {
      request.logger.error(`Refresh token error: ${error.message}`);
      return h
        .response({
          data: {
            success: false,
            msg: 'Failed to refresh token',
          },
        })
        .unstate('rft')
        .code(401);
    }
  },
  options: {
    cors: {
      credentials: true,
    },
  },
};

export const logoutRoute: Hapi.ServerRoute = {
  method: 'GET',
  path: '/auth/logout',
  handler: async (request, h): Promise<Hapi.ResponseObject> => {
    const token = request?.state?.rft || '';
    if (token) {
      await logout(token);
    }
    return h
      .response({
        data: {
          success: true,
          msg: 'User logged out',
        },
      })
      .unstate('rft')
      .code(200);
  },
  options: {
    cors: {
      credentials: true,
    },
  },
};

export const logoutAll: Hapi.ServerRoute = {
  method: 'GET',
  path: '/auth/logout-all',
  handler: async (request, h): Promise<Hapi.ResponseObject> => {
    return h
      .response({
        data: {
          success: true,
          msg: 'User logged out',
        },
      })
      .unstate('rft')
      .code(200);
  },
  options: {
    cors: {
      credentials: true,
    },
  },
};

export const getNonce: Hapi.ServerRoute = {
  method: 'GET',
  path: '/auth/{address}/nonce',
  handler: async (request, _h): Promise<{ data: { nonce: string } }> => {
    const { address } = request.params;
    try {
      request.logger.info(`Getting nonce for address: ${address}`);
      const nonce = await users.getNonceByEthAddress(address);

      if (!nonce) {
        request.logger.error(`Nonce not found for address: ${address}`);
      }

      return {
        data: {
          nonce,
        },
      };
    } catch (error) {
      request.logger.error(`Failed to get nonce: ${error.message}`);
      throw error;
    }
  },
  options: {
    validate: {
      params: Joi.object({
        address: Joi.string().required(),
      }),
    },
  },
};

export const validateSignature: Hapi.ServerRoute = {
  method: 'POST',
  path: '/auth/{address}/signature',
  handler: async (request, h): Promise<Hapi.ResponseObject> => {
    const { address } = request.params;
    const { signature } = request.payload as { signature: string };
    try {
      const user = await users.getUserByEthAddress(address);
      if (!user) {
        request.logger.error(`User not found for ${address}`);
        throw Boom.notFound('User not found');
      }

      const { id: userId, eth_address: ethAddress, nonce, access } = user;
      const messageHash = ethUtil.hashPersonalMessage(Buffer.from(nonce, 'utf8'));
      const signatureParameters = ethUtil.fromRpcSig(signature);
      const publicKey = ethUtil.ecrecover(
        messageHash,
        signatureParameters.v,
        signatureParameters.r,
        signatureParameters.s,
      );
      const addressBuffer = ethUtil.publicToAddress(publicKey);
      const addressFromSignature = ethUtil.bufferToHex(addressBuffer);

      // Check if address matches address from signature
      if (addressFromSignature.toLowerCase() === address.toLowerCase()) {
        await users.updateNonce(address, uuidV4());

        const payload = { sub: userId, eth_address: ethAddress, access };
        const accessToken = generateAccessToken(payload);
        const browserInfo = getBrowserInfo(request);
        const refreshToken = await createRefreshToken({ sub: payload.sub }, browserInfo);

        return h
          .response({
            data: {
              success: true,
              accessToken,
              refreshToken,
              user: address,
              msg: 'Login successful',
            },
          })
          .state('rft', refreshToken)
          .code(200);
      }

      request.logger.error(`Signature validation failed for address ${address}`);
      return h
        .response({
          data: {
            success: false,
            msg: 'Invalid credentials',
          },
        })
        .unstate('rft')
        .code(401);
    } catch (error) {
      request.logger.error(`Sign error: ${error.message}`);
      return h
        .response({
          data: {
            success: false,
            msg: 'Login failed',
          },
        })
        .unstate('rft')
        .code(500);
    }
  },
  options: {
    validate: {
      params: Joi.object({
        address: Joi.string().required(),
      }),
      payload: Joi.object({
        signature: Joi.string().required(),
      }),
    },
    cors: {
      credentials: true,
    },
  },
};
