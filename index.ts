import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import express, { Response } from 'express';
const app = express();

/***** EVENTS *****/

interface ChatEvents {
  error: (error: Error) => void;
  message: (body: string, showUserName: boolean) => void;
  user_join: (res: Response, name: string) => void;
  user_left: () => void;
  update_users_list: () => void;
}

const chatEmitter = new EventEmitter() as TypedEmitter<ChatEvents>;

const sendText = (text: string | number, showUserName = true) => {
  for (const clientId in clients) {
    let data = '';
    const date = new Date();
    const timestamp = `[${date.getHours()}:${date.getMinutes()}]`;
    if (showUserName) {
      data = `data: ${JSON.stringify(`${timestamp} <${actUserName}> ${text}`)}\n\n`;
    } else {
      data = `data: ${JSON.stringify(`${timestamp} ${text}`)}\n\n`;
    }
    clients[clientId].write(data);
  }
};

const userJoin = (res: Response, name: string): void => {
  clientId++;
  clients[clientId] = res;
  clientNames[clientId] = name;
  clientsArr.push(name);

  chatEmitter.emit('message', name + ' connected!', false); // Send connected in message

  chatEmitter.emit('update_users_list'); // Send updated users list
};

const userLeft = (): void => {
  clientsArr = clientsArr.filter((client) => clientNames[clientId] !== client);
  delete clients[clientId];
  actUserName = '';
  chatEmitter.emit('message', clientNames[clientId] + ' disconnected!', false); // Send disconnected in message
  delete clientNames[clientId];
  chatEmitter.emit('update_users_list');
};

const sendUsersList = (): void => {
  for (const clientId in clients) {
    clients[clientId].write(`data: ${JSON.stringify({ users: clientsArr })}\n\n`);
  }
};

chatEmitter.addListener('message', sendText);
chatEmitter.addListener('user_join', userJoin);
chatEmitter.addListener('user_left', userLeft);
chatEmitter.addListener('update_users_list', sendUsersList);

/***** VARIABLES *****/
import { Clients, ClientNames } from './types';

let clientId = 0;
const clients: Clients = {};
let actUserName = '';
const clientNames: ClientNames = {};
let clientsArr: string[] = [];

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

  req.on('close', () => {
    chatEmitter.emit('user_left'); // Send left massage and delete user data
  });

  chatEmitter.emit('user_join', res, req.params.name); // Save user ame and response and sent connected and join messages
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
