'use strict';

// Load environment variables before New Relic boots up
require('dotenv').config();

exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'Clario-Backend-Production'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info',
  },
  application_logging: {
    forwarding: {
      enabled: true,
    },
  },
};
