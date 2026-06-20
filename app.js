const express = require('express')
const expressWs = require('express-ws')

const app = express()
expressWs(app)

const port = process.env.PORT || 3001
let connects = []

app.use(express.static('public'))

app.ws('/ws', (ws, req) => {
  connects.push({
    ws,
    name: '名無し'
  })

  broadcastUserCount()

  ws.on('message', (message) => {
    console.log('Received:', message)

    const msg = JSON.parse(message)

    // ユーザー名設定
    if (msg.type === 'username') {
      const user = connects.find((c) => c.ws === ws)

      if(user) {
        user.name = msg.name
      }

      return
    }

    // チャット
    if (msg.type === 'chat') {
      const user = connects.find((c) => c.ws === ws)

      const chatMessage = JSON.stringify({
        type: 'chat',
        name: user ? user.name: '名無し',
        text: msg.text,
      })

      connects.forEach((client) => {
        if (client.ws.readyState === 1) {
          client.ws.send(chatMessage)
        }
      })
    }

    if (msg.type === 'paint') {
      connects.forEach((client) => {
        if (client.ws.readyState === 1) {
          client.ws.send(message)
        }
      })
    }
  })

  ws.on('close', () => {
    connects = connects.filter((conn) => conn.ws !== ws)

    breadcastUserCount()
  })
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})

function broadcastUserCount() {
  const countMessage = JSON.stringify({
    type: 'count', 
    count: connects.length,
  })

  connects.forEach((client) => {
    if(client.ws.readyState === 1) {
      client.ws.send(countMessage)
    }
  })
}