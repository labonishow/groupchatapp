const messageInput = document.getElementById("msgInput");
const messages = document.getElementById("messages");

function getCurrentTime() {
    const now = new Date();

    return now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function sendMessage() {
    const text = messageInput.value.trim();

    if (!text) {
        return;
    }

    const message = document.createElement("div");

    message.className = "message outgoing";

    message.innerHTML = `
        <div class="bubble">
            ${text}
            <span class="time">${getCurrentTime()}</span>
        </div>
    `;

    messages.appendChild(message);

    messageInput.value = "";
    messages.scrollTop = messages.scrollHeight;
}