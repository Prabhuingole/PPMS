const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:8000'
});

console.log(api.getUri({ url: '/employees/' }));
