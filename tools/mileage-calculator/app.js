require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var logger = require('morgan');

var webhooksRouter = require('./routes/webhooks');

var app = express();

// Behind ngrok (dev) and Render (prod) this is needed so req.protocol
// reflects the original https scheme via X-Forwarded-Proto, not the
// scheme of the local/internal connection — signature verification
// depends on reconstructing the exact URL HubSpot signed.
app.set('trust proxy', true);

app.use(logger('dev'));
app.use(
  express.json({
    // Capture the exact raw bytes of the request body — signature
    // verification must hash what was actually sent, not a
    // re-serialized version of the parsed JSON (key ordering/whitespace
    // differences would break the signature).
    verify: (req, res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);
app.use(express.urlencoded({ extended: false }));

app.use('/webhooks', webhooksRouter);

// simple health check for Render
app.get('/health', function (req, res) {
  res.json({ status: 'ok' });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// JSON error handler — no views, this is an API-only service
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    error: err.message,
    stack: req.app.get('env') === 'development' ? err.stack : undefined,
  });
});

module.exports = app;
