const path = require('path')
const fileSystem = require('fs')
const http = require('http')
const uuid = require('uuid/v4')

// Fake database
const database = {
  items: [
    { id: uuid(), text: 'Do laundry' },
    { id: uuid(), text: 'Workout' },
  ],
}

// Database helper method
const makeItem = text => ({
  id: uuid(),
  text
})

// Instantiate server
const server = http.createServer()

// Helper method to extract request body
const extractBodyJSON = request => new Promise((resolve, reject) => {
  let body = [];
  request.on('error', (err) => {
    reject(err)
  }).on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    body = Buffer.concat(body).toString();
    body = JSON.parse(body)
    resolve(body)
  });
})

// Helper method to send payload
const sendPayload = (response, payload) => {
  response.statusCode = 200
  response.setHeader('Content-Type', 'application/json')
  payload = JSON.stringify(payload)
  response.end(payload)
}

// Listen for requests
server.on('request', async (request, response) => {
  const { url, method, headers } = request

  // Handle API requests
  if (url.startsWith('/api')) {
    if (url === '/api' && method === 'GET') {
      sendPayload(response, database.items)
    } else if (url === '/api' && method === 'POST') {
      const { text } = await extractBodyJSON(request)
      const item = makeItem(text)
      database.items = [...database.items, item]
      sendPayload(response, item)
    } else if (method === 'PUT') {
      const id = url.slice(5)
      const { text } = await extractBodyJSON(request)
      let updatedItem;
      database.items = database.items.map(item => {
        if (item.id === id) {
          return (updatedItem = { id, text })
        } else {
          return item
        }
      })
      sendPayload(response, updatedItem)
    } else if (method === 'DELETE') {
      const id = url.slice(5)
      database.items = database.items.filter(item => item.id !== id)
      sendPayload(response, {})
    }
  }


})

// Port number
const PORT = process.env.port || 5000

// Start server
server.listen(PORT, e => {
  if (e) {
    throw e
  } else {
    console.log(`Listening on: ${PORT}`)
  }
})
