// const bodyParser = require("body-parser");
// app.use(express.urlencoded({ extended: false }));

import express from 'express';
const app = express();

app.use(express.json());

let clientId = 0;
const clients = {};
let actUserName = '';
const clientNames = {};

const sendText = (text, showUserName = true) => {
  for (clientId in clients) {
    let data = '';
    const date = new Date();
    const timestamp = `[${date.getHours()}:${date.getMinutes()}]`;
    if (showUserName) {
      data = `data: ${timestamp} <${actUserName}> ${text}\n\n`;
    } else {
      data = `data: ${timestamp} ${text}\n\n`;
    }
    clients[clientId].write(data);
  }
};

app.use('/', express.static('static'));

app.get('/chat/:name', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');
  (function (clientId) {
    clients[clientId] = res;
    clientNames[clientId] = req.params.name;
    req.on('close', () => {
      delete clients[clientId];
      actUserName = '';
      sendText(clientNames[clientId] + ' disconnected!', false);
      delete clientNames[clientId];
    });
  })(++clientId);

  sendText(req.params.name + ' connected!', false);
  let allMates = '';
  for (cliId in clientNames) {
    allMates += `${clientNames[cliId]}`;
    if (cliId < clientId) allMates += ' ';
  }
  sendText(`logged in [${allMates}]`, false);
});

app.post('/write/', (req, res) => {
  actUserName = req.body.name;
  sendText(req.body.text);
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log('Server running.');
});
