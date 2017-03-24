const session = require('express-session');
const sessionMiddleware = session({
  secret: 'keyboard cat',
  cookie: {}
});

module.exports = sessionMiddleware;