interface MetaEnvironment {
  PUBLIC_API_URL: string | undefined;
}

export const { PUBLIC_API_URL = 'http://localhost:3000' } = import.meta.env as unknown as MetaEnvironment;

export default {
  PUBLIC_API_URL,
};
