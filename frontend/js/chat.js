const token = localStorage.getItem("chattoken");

if (!token) {
    window.location.href = "signin.html";
}

function parseJwt(jwtToken) {
    try {
        return JSON.parse(atob(jwtToken.split(".")[1]));
    } catch (error) {
        return null;
    }
}

const currentUser = parseJwt(token);
const currentUserId = currentUser ? currentUser.userId : null;

axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

const messageInput = document.getElementById("msgInput");
const messagesEl = document.getElementById("messages");

function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function renderMessage(msg) {
    const senderId = msg.User ? msg.User.id : msg.senderId;
    const isOwn = senderId === currentUserId;

    const message = document.createElement("div");
    message.className = "message " + (isOwn ? "outgoing" : "incoming");

    const senderName = msg.User ? msg.User.name : "";

    message.innerHTML = `
        <div class="bubble">
            ${!isOwn ? `<div style="font-size:11px;color:#c9b8f5;margin-bottom:3px;">${senderName}</div>` : ""}
            ${msg.text}
            <span class="time">${formatTime(msg.createdAt)}</span>
        </div>
    `;

    messagesEl.appendChild(message);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function loadMessages() {
    try {
        const response = await axios.get("http://localhost:5000/api/messages");

        response.data.forEach(renderMessage);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    } catch (error) {
        console.error(error);
    }
}

const socket = io("http://localhost:5000");
socket.on("chatMessage",(msg)=>{
    renderMessage(msg);
});

function sendMessage(){
    const text = messageInput.value.trim();
    if(!text){
        return;
    }
    socket.emit("chatMessage",{token,text});
    messageInput.value = "";
}

loadMessages();