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
    let div = document.createElement("div");

    div.className = "history-item";

    if (index === currentChat) {
      div.classList.add("active");
    }

    let title = document.createElement("span");
    title.innerText = item.title;

    let deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-chat";
    deleteBtn.title = "Delete chat";
    deleteBtn.setAttribute("aria-label", "Delete chat");

    deleteBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.2"
        stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6"/>
          <path d="M14 11v6"/>
          <path d="M9 6V4h6v2"/>
      </svg>
    `;

    deleteBtn.onclick = (e) => {
      e.stopPropagation(); // Prevent opening the chat
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

    chat.innerHTML = "";
  } else if (currentChat > index) {
    currentChat--;
  }

  save();

  renderHistory();
}

function openChat(index) {
  currentChat = index;

  chat.innerHTML = "";

  chats[index].messages.forEach((message) => {
    addMessage(message.sender, message.text, false);
  });

  renderHistory();
}

function createChat() {
  chats.unshift({
    title: "New conversation",

    messages: [],
  });

  currentChat = 0;

  save();

  renderHistory();

  openChat(0);
}

function addMessage(sender, text, saveMessage = true) {
  let div = document.createElement("div");

  div.className = "message " + sender;

  div.innerText = text;

  chat.appendChild(div);

  if (saveMessage) {
    chats[currentChat].messages.push({
      sender,
      text,
    });

    save();
  }

  chat.scrollTop = chat.scrollHeight;
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

  addMessage("user", text);

  input.value = "";

  // TEMP AI RESPONSE
  // Later replaced with AWS Lambda + Llama

  setTimeout(() => {
    addMessage(
      "ai",
      "I am ready. Soon I will connect to Llama through AWS Lambda.",
    );
  }, 500);
};

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    send.click();
  }
});

renderHistory();
