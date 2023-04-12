import Hapi from '@hapi/hapi';
import jwt from 'jsonwebtoken';
import { v4 as uuidV4 } from 'uuid';
import { users, tokens } from '@labralords/database';
import Boom from '@hapi/boom';

export const accessJwtSecret =
  process.env.ACCESS_JWT_SECRET || '14c468a8d51cf46254856b9c2f8adf6f2212fb82bac1b03af07c71abb72838c5';
export const refreshJwtSecret =
  process.env.REFRESH_JWT_SECRET || '14c468a8d51cf46254856b9c2f9adf6f2212fb82bac1b03af07c71abb72838c5';

export interface RefreshTokenPayload {
  sub: string;
  tokenFamily: string;
}

export interface AccessTokenPayload {
  sub: string;
  eth_address: string;
  access: boolean;
}

export const getBrowserInfo = (request: Hapi.Request) => {
  const userAgent = request.headers['user-agent'];
  const { accept } = request.headers;
  const acceptEncoding = request.headers['accept-encoding'];
  const acceptLanguage = request.headers['accept-language'];
  const ip = request.headers['cf-connecting-ip'] || request.info.remoteAddress;
  return { ip, userAgent, accept, acceptEncoding, acceptLanguage };
};

export const generateAccessToken = (payload: AccessTokenPayload) => {
  const token = jwt.sign(payload, accessJwtSecret, {
    expiresIn: '15m',
  });
  return token;
};

export const generateRefreshToken = (payload: RefreshTokenPayload) => {
  const token = jwt.sign(payload, refreshJwtSecret, {
    expiresIn: '90d',
  });
  return token;
};

export const createRefreshToken = async (
  incomingPayload: { sub: string; tokenFamily?: string },
  browserInfo: object,
) => {
  const payload = {
    ...incomingPayload,
    tokenFamily: incomingPayload.tokenFamily || uuidV4(),
  };

  const token = generateRefreshToken({ ...payload });

  await tokens.saveRefreshToken({
    user_id: payload.sub,
    token,
    family: payload.tokenFamily,
    browser_info: browserInfo,
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  });

  return token;
};

export const rotateRefreshToken = async (
  refreshToken: string,
  refreshTokenPayload: RefreshTokenPayload,
  browserInfo: object,
) => {
  await tokens.deleteUserToken(refreshToken);
  const newRefreshToken = await createRefreshToken(
    {
      sub: refreshTokenPayload.sub,
      tokenFamily: refreshTokenPayload.tokenFamily,
    },
    browserInfo,
  );
  return newRefreshToken;
};

export const removeRefreshTokenFamilyIfCompromised = async (userId: string, tokenFamily: string) => {
  await tokens.deleteUserTokenFamily(userId, tokenFamily);
};

export const validateRefreshToken = async (refreshToken: string, refreshTokenPayload: RefreshTokenPayload) => {
  const userTokens = await tokens.fetchUserTokens(refreshTokenPayload.sub, refreshToken);
  const isRefreshTokenValid = userTokens.length > 0;
  if (!isRefreshTokenValid) {
    await removeRefreshTokenFamilyIfCompromised(refreshTokenPayload.sub, refreshTokenPayload.tokenFamily);
    throw Boom.forbidden('Refresh token invalid');
  }

  return true;
};

export const refreshTokens = async (refreshToken: string, browserInfo: object) => {
  const refreshTokenPayload = jwt.verify(refreshToken, refreshJwtSecret) as RefreshTokenPayload;
  await validateRefreshToken(refreshToken, refreshTokenPayload);

  const user = await users.getUserById(refreshTokenPayload.sub);

  if (!user) {
    throw Boom.forbidden();
  }

  const accessToken = generateAccessToken({
    sub: refreshTokenPayload.sub,
    eth_address: user.eth_address?.toLowerCase(),
    access: user.access,
  });

  const newRefreshToken = await rotateRefreshToken(refreshToken, refreshTokenPayload, browserInfo);
  return {
    accessToken,
    refreshToken: newRefreshToken,
    ethAddress: user.eth_address?.toLowerCase(),
  };
};

export const verifyAccessTokenOrRefreshToken = async (
  accessToken: string,
  refreshToken: string,
  browserInfo: object,
) => {
  try {
    const { eth_address: ethAddress } = jwt.verify(accessToken, accessJwtSecret) as { eth_address: string };
    return { ethAddress };
  } catch (error) {
    console.error(`Verify access token error: ${error.message}`);
    if (error.message?.includes('jwt must be provided') || error.message?.includes('jwt expired')) {
      const { ethAddress } = await refreshTokens(refreshToken, browserInfo);
      return { ethAddress };
    }
    return null;
  }
};

export const logout = async (refreshToken: string) => {
  await tokens.logout(refreshToken);
};

export const logoutAll = async (userId: string) => {
  await tokens.logoutAll(userId);
};

export default {
  accressJwtSecret: accessJwtSecret,
  refreshJwtSecret,
  generateAccessToken,
  generateRefreshToken,
  createRefreshToken,
  rotateRefreshToken,
  removeRefreshTokenFamilyIfCompromised,
  validateRefreshToken,
  refreshTokens,
  logout,
  logoutAll,
};
