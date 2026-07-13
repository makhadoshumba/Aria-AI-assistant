const API_URL = "https://aria-ai-worker.shumba-ai.workers.dev";
const history = document.getElementById("history");
const chat = document.getElementById("chat");

const newChat = document.getElementById("newChat");
const send = document.getElementById("send");
const input = document.getElementById("message");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.querySelector(".sidebar");

let chats = JSON.parse(localStorage.getItem("chats")) || [];

let currentChat = null;

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

async function sendToAI(message) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        message: message,
      }),
    });

    const data = await response.json();

    return data.reply;
  } catch (error) {
    console.error(error);

    return "Sorry, I could not connect to Aria.";
  }
}

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
  } else if (currentChat > index) {
    currentChat--;
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

  showWelcome();
}

function openChat(index) {
  currentChat = index;

  chat.innerHTML = "";

  // Check if this chat has no messages
  if (chats[index].messages.length === 0) {
    showWelcome();
  } else {
    chats[index].messages.forEach((msg) => {
      addMessage(msg.sender, msg.text, false);
    });
  }

  renderHistory();
  sidebar.classList.remove("open");
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

newChat.onclick = () => {
  createChat();
};

send.onclick = async () => {
  let text = input.value.trim();

  if (!text) return;

  if (currentChat === null) {
    createChat();
  }

  chat.querySelector(".welcome")?.remove();

  addMessage("user", text);

  input.value = "";
  const loadingMessage = document.createElement("div");

  loadingMessage.className = "message ai loading";

  loadingMessage.innerText = "Aria is thinking...";

  chat.appendChild(loadingMessage);

  chat.scrollTop = chat.scrollHeight;

  const reply = await sendToAI(text);

  loadingMessage.remove();

  addMessage("ai", reply);
};

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    send.click();
  }
});

renderHistory();

function showLoading() {
  const div = document.createElement("div");

  div.className = "message ai loading";

  div.innerText = "Aria is thinking...";

  chat.appendChild(div);

  chat.scrollTop = chat.scrollHeight;

  return div;
}

menuBtn.onclick = () => {
  sidebar.classList.toggle("open");
};
