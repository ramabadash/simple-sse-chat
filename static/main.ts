let enteredName = false;

const myName = prompt('Whats your name?');

const chatElem = <HTMLTextAreaElement>document.getElementById('chat');
const textElem = <HTMLInputElement>document.getElementById('text');
const frmElem = <HTMLFormElement>document.getElementById('frm');

if (myName != null) {
  chatElem.value += 'Connecting...\n';
  enteredName = true;
}

if (enteredName) {
  const source = new EventSource('/chat/' + myName);
  source.onmessage = ({ data }) => {
    data = JSON.parse(data);
    // Users list data
    if (data.users) {
      //Remove last users list
      const lastUsersListElem = document.getElementsByTagName('ul')[0];
      if (lastUsersListElem) {
        lastUsersListElem.remove();
      }
      // Create new users list
      const usersUl = document.createElement('ul');
      for (const user of data.users) {
        const userLi = document.createElement('li');
        userLi.textContent = user;
        usersUl.appendChild(userLi);
      }

      document.body.appendChild(usersUl);
    } else {
      // Message data
      chatElem.value += data + '\n';
      chatElem.scrollTop = chatElem.scrollHeight;
      textElem.value = '';
      textElem.placeholder = 'Write your message here...';
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  frmElem.addEventListener('submit', async (e): Promise<void> => {
    e.preventDefault();
    const textToPost = `{
      "name": "${myName}", 
      "text": "${textElem.value}"
    }`;
    // Send message to all
    const response = await fetch('/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: textToPost,
    });

    if (!response.ok) {
      console.log('error');
    } else {
      console.log('message sent');
    }
  });
}
