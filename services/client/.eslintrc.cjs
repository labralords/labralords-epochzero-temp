module.exports = {
  extends: ['../../baseconfigs/.eslintrc.cjs'],
  rules: {
    'unicorn/filename-case': [
      'error',
      {
        case: 'camelCase',
        ignore: ['^vite-env.d.ts$'],
      },
    ],
    'unicorn/prevent-abbreviations': [
      'error',
      {
        allowList: {
          env: true,
        },
      },
    ],
  },
};
