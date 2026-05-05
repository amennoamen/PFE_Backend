require('dotenv').config();
const bcService = require('./services/bc.service');

async function test() {
  const health = await bcService.checkHealth();
  console.log('Health:', health);
}

test();