const axios = require('axios');

module.exports = axios.create({
  baseURL: 'http://code.smartstudy.com/api/v4',
  timeout: 1000,
});
