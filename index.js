const path = require('path');
const fileSystem = require('fs');
const http = require('http');
const uuid = require('uuid/v4');

// Fake database
const database = {
  items: [{ id: uuid(), text: 'Do laundry' }, { id: uuid(), text: 'Workout' }],
};

// Database helper method
const makeItem = text => ({
  id: uuid(),
  text,
});

// Instantiate server
const server = http.createServer();

// Helper method to extract request body
const extractBodyJSON = request =>
  new Promise((resolve, reject) => {
    let body = [];
    request
      .on('error', err => {
        reject(err);
      })
      .on('data', chunk => {
        body.push(chunk);
      })
      .on('end', () => {
        body = Buffer.concat(body).toString();
        body = JSON.parse(body);
        resolve(body);
      });
  });

// Helper method to send payload
const sendPayload = (response, payload) => {
  response.statusCode = 200;
  response.setHeader('Content-Type', 'application/json');
  payload = JSON.stringify(payload);
  response.end(payload);
};

// Listen for requests
server.on('request', async (request, response) => {
  const { url, method } = request;

  // Handle API requests
  if (url.startsWith('/api')) {
    if (url === '/api' && method === 'GET') {
      sendPayload(response, database.items);
    } else if (url === '/api' && method === 'POST') {
      const { text } = await extractBodyJSON(request);
      const item = makeItem(text);
      database.items = [...database.items, item];
      sendPayload(response, item);
    } else if (method === 'PUT') {
      const id = url.slice(5);
      const { text } = await extractBodyJSON(request);
      let updatedItem;

      database.items = database.items.map(item => {
        if (item.id === id) {
          return (updatedItem = { id, text });
        } else {
          return item;
        }
      });

      sendPayload(response, updatedItem);
    } else if (method === 'DELETE') {
      const id = url.slice(5);
      database.items = database.items.filter(item => item.id !== id);
      sendPayload(response, {});
    }
  }
  // Handle file paths
  else {
    let filePath = path.join(
      __dirname,
      'public',
      request.url === '/' ? 'index.html' : request.url
    );

    let extname = path.extname(filePath);

    let contentType = 'text/html';

    switch (extname) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
        contentType = 'image/jpg';
        break;
    }

    if (contentType == 'text/html' && extname == '') filePath += '.html';

    fileSystem.readFile(filePath, (e, data) => {
      if (!e) {
        response.statusCode = 200;
        response.setHeader('Content-Type', contentType);
        response.end(data, 'utf8');
      } else {
        fileSystem.readFile(
          path.join(__dirname, 'public/404.html'),
          (e, data) => {
            if (e) {
              throw e;
            } else {
              response.statusCode = 404;
              response.setHeader('Content-Type', 'text/html');
              response.end(data, 'utf8');
            }
          }
        );
      }
    });
  }
});

// Port number
const PORT = process.env.port || 5000;

// Start server
server.listen(PORT, e => {
  if (e) {
    throw e;
  } else {
    console.log(`Listening on: ${PORT}`);
  }
});
