export const toKebabCase = (string_: string) =>
  string_ &&
  string_
    .match(/[A-Z]{2,}(?=[A-Z][\da-z]*|\b)|[A-Z]?[\da-z]*|[A-Z]|\d+/g)
    .filter(Boolean)
    .map((x) => x.toLowerCase())
    .join('-');

export const uppercaseEveryFirstLetter = (string_: string) =>
  string_ &&
  string_
    .split(' ')
    .map((word) => (word[0]?.toUpperCase() || '') + word.slice(1))
    .join(' ');

export const getToken = (network: string) => {
  switch (network) {
    case 'iota':
      return 'MIOTA';
    case 'smr':
      return 'SMR';
    default:
      return 'MIOTA';
  }
};
