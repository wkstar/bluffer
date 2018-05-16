import express from 'express';
import httpProxy from 'http-proxy';
import winston from 'winston';

export default ({ dataStore, proxyConfig, socketIo }) => {
  const router = express.Router();

  const proxy = httpProxy.createProxyServer({ secure: false, changeOrigin: true });

  proxy.on('proxyRes', (proxyRes, req, res) => {
    res.setHeader('X-Bluffer-Proxy', 'bluffer-proxy');

    let responseBody = '';
    proxyRes.on('data', (data) => {
      responseBody += data.toString('utf-8');
    });

    proxyRes.on('end', () => {
      setTimeout(() => {
        console.log(responseBody)
        if (proxyRes.statusCode === 404) {
          const loggedResponse = dataStore.logResponse(proxyConfig.port, req.originalUrl, String('Not found'), req.headers.host);
          socketIo.emit('request_proxied', { loggedResponse, proxyId: proxyConfig.port });
          return;
        }
        if (proxyRes.statusCode > 200) {
          winston.warn(`Error received from target API from target ${proxyConfig.target}: ${proxyRes.statusCode} ${String(responseBody)}`);
          return;
        }
        const loggedResponse = dataStore.logResponse(proxyConfig.port, req.originalUrl, String(responseBody), req.headers.host);
        socketIo.emit('request_proxied', { loggedResponse, proxyId: proxyConfig.port });
      }, 500);
    });
  });

  proxy.on('error', (err, aaaa, bbbb, cccc, dddd, eeee) => {
    winston.error(`Proxy Error from target ${proxyConfig.target}`, err);
    socketIo.emit('request_proxied', { loggedResponse: { url: aaaa.url }, proxyId: proxyConfig.port });
    // console.log(err, '||||||', aaaa, '&&&&', bbbb, 'KKKKK', cccc, 'LLLL', dddd, 'MMMM', eeee)
    // console.log('111XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', err)
    // console.log('222XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', aaaa.url)
    // console.log('333XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', bbbb.url)
    // console.log('444XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', cccc.url)
  });

  proxy.on('proxyReq', (proxyReq, req, /* res, options */) => {
    winston.debug(`Processing request ${req.originalUrl}`);
    winston.debug(`Setting Host Header to ${proxyConfig.host}`);
    proxyReq.setHeader('Host', proxyConfig.host);
    proxyReq.setHeader('cookie', '');
    proxyReq.setHeader('accept-encoding', '');
  });

  router.get('/favicon.ico', (req, res) => {
    res.sendStatus(200);
  });

  router.get('*', (req, res) => {
    const url = req.originalUrl;
    const mock = dataStore.getMock(proxyConfig.port, url);
    if (!mock) {
      winston.debug(`Proxying request for url ${url} to target ${proxyConfig.target}`);
      return proxy.web(req, res, { target: proxyConfig.target });
    }

    winston.debug(`Using mock response for url ${url}`);
    try {
      res.json(JSON.parse(mock.responseBody));
    } catch (err) {
      res.send(mock.responseBody);
    }
    socketIo.emit('mock_served', { url, proxyId: proxyConfig.port });
  });

  return router;
};
