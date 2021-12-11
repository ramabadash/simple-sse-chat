import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import express from 'express';
const app = express();

/***** EVENTS *****/

interface ChatEvents {
  error: (error: Error) => void;
  message: (body: string, showUserName: boolean) => void;
}

const chatEmitter = new EventEmitter() as TypedEmitter<ChatEvents>;

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

chatEmitter.addListener('message', sendText);

/***** VARIABLES *****/
import { Clients, ClientNames } from './types';

let clientId = 0;
const clients: Clients = {};
let actUserName = '';
const clientNames: ClientNames = {};

/***** MIDDLEWARES *****/
app.use(express.json());

/***** ROUTERS *****/
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
      chatEmitter.emit('message', clientNames[clientId] + ' disconnected!', false); // Send disconnected in message
      delete clientNames[clientId];
    });
  })();

  chatEmitter.emit('message', req.params.name + ' connected!', false); // Send connected in message
  let allMates = '';
  for (const cliId in clientNames) {
    allMates += `${clientNames[cliId]}`;
    if (Number(cliId) < clientId) allMates += ' ';
  }
  chatEmitter.emit('message', `logged in [${allMates}]`, false); // Send logged in message
});

app.post('/write/', (req, res) => {
  if (req.body) {
    actUserName = req.body.name ? String(req.body.name) : '';
    if (typeof req.body.text === 'string' || typeof req.body.text === 'number') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      chatEmitter.emit('message', req.body.text, true); // Send message to all
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
