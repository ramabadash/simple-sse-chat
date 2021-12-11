import express from 'express';
const app = express();

/***** VARIABLES *****/
import { Clients, ClientNames } from './types';

let clientId = 0;
const clients: Clients = {};
let actUserName = '';
const clientNames: ClientNames = {};

/***** MIDDLEWARES *****/
app.use(express.json());

const sendText = (text: string | number, showUserName = true) => {
  for (const clientId in clients) {
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
  (function () {
    clientId++;
    clients[clientId] = res;
    clientNames[clientId] = req.params.name;
    req.on('close', () => {
      delete clients[clientId];
      actUserName = '';
      sendText(clientNames[clientId] + ' disconnected!', false);
      delete clientNames[clientId];
    });
  })();

  sendText(req.params.name + ' connected!', false);
  let allMates = '';
  for (const cliId in clientNames) {
    allMates += `${clientNames[cliId]}`;
    if (Number(cliId) < clientId) allMates += ' ';
  }
  sendText(`logged in [${allMates}]`, false);
});

app.post('/write/', (req, res) => {
  if (req.body) {
    actUserName = req.body.name ? String(req.body.name) : '';
    if (typeof req.body.text === 'string' || typeof req.body.text === 'number') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      sendText(req.body.text);
    } else {
      res.status(400).send('Bad text!');
    }
    res.json({ success: true });
  } else {
    res.status(400).send('Bad request!');
  }
});

app.listen(3000, () => {
  console.log('Server running.');
});
