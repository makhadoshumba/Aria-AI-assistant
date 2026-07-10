const history = document.getElementById("history");
const chat = document.getElementById("chat");

const newChat = document.getElementById("newChat");
const send = document.getElementById("send");
const input = document.getElementById("message");

let chats = JSON.parse(localStorage.getItem("chats")) || [];

let currentChat = null;

function save() {
  localStorage.setItem("chats", JSON.stringify(chats));
}

function renderHistory() {
  history.innerHTML = "";

  chats.forEach((item, index) => {
    const div = document.createElement("div");

    div.className = "history-item";

    if (index === currentChat) {
      div.classList.add("active");
    }

    const title = document.createElement("span");

    title.innerText = item.title;

    const deleteBtn = document.createElement("button");

    deleteBtn.className = "delete-chat";

    deleteBtn.innerHTML = `
     <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2.2"
     stroke-linecap="round" stroke-linejoin="round">

     <polyline points="3 6 5 6 21 6"/>

     <path d="M19 6l-1 14H6L5 6"/>

     <path d="M10 11v6"/>

     <path d="M14 11v6"/>

     <path d="M9 6V4h6v2"/>

     </svg>`;

    deleteBtn.onclick = (e) => {
      e.stopPropagation();

      deleteChat(index);
    };

    div.appendChild(title);

    div.appendChild(deleteBtn);

    div.onclick = () => {
      openChat(index);
    };

    history.appendChild(div);
  });
}

function deleteChat(index) {
  chats.splice(index, 1);

  if (currentChat === index) {
    currentChat = null;

    showWelcome();
  }

  save();

  renderHistory();
}

function createChat() {
  chats.unshift({
    title: "New chat",

    messages: [],
  });

  currentChat = 0;

  save();

  renderHistory();

  openChat(0);
}

function openChat(index) {
  currentChat = index;

  chat.innerHTML = "";

  chats[index].messages.forEach((msg) => {
    addMessage(msg.sender, msg.text, false);
  });

  renderHistory();
}

function addMessage(sender, text, saveMessage = true) {
  const div = document.createElement("div");

  div.className = "message " + sender;

  div.innerText = text;

  chat.appendChild(div);

  if (saveMessage) {
    chats[currentChat].messages.push({
      sender,

      text,
    });

    updateTitle();

    save();
  }

  chat.scrollTop = chat.scrollHeight;
}

function updateTitle() {
  const messages = chats[currentChat].messages;

  if (messages.length === 1) {
    chats[currentChat].title = messages[0].text.substring(0, 25);
  }
}

function showWelcome() {
  chat.innerHTML = `

<div class="welcome">

<div class="big-orb"></div>

<h1>
Where should we begin?
</h1>


<p>
Ask anything and Aria will help you.
</p>

</div>

`;
}

newChat.onclick = () => {
  createChat();
};

send.onclick = () => {
  let text = input.value.trim();

  if (!text) return;

  if (currentChat === null) {
    createChat();
  }

  chat.querySelector(".welcome")?.remove();

  addMessage("user", text);

  input.value = "";

  // TEMP RESPONSE

  setTimeout(() => {
    addMessage(
      "ai",
      "I am Aria. Soon I will connect to Llama through Cloudflare Workers.",
    );
  }, 500);
};

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    send.click();
  }
});

renderHistory();
