const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'Welcome@123';

const hashPassword = async (plainText) => {
  return bcrypt.hash(plainText, SALT_ROUNDS);
};

const hashDefault = async () => {
  return bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
};

const comparePassword = async (plainText, hash) => {
  return bcrypt.compare(plainText, hash);
};

module.exports = { hashPassword, hashDefault, comparePassword, DEFAULT_PASSWORD };
