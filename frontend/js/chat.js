const token = localStorage.getItem("chattoken");
const myEmail = localStorage.getItem("email");

if (!token || !myEmail) {
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

const messageInput = document.getElementById("msgInput");
const messagesEl = document.getElementById("messages");
const chatListEl = document.getElementById("chatList");

let roomName = null;

axios.defaults.headers.common["Authorization"] = "Bearer " + token;

const socket = io("http://localhost:5000", {
    auth: { token: token },
});

socket.on("connect_error", (error) => {
    console.log("Connection failed:", error.message);
});

function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function renderMessage(msg) {
    const isOwn = msg.senderId === currentUserId;

    let senderName = "";

    if (msg.User) {
        senderName = msg.User.name;
    }

    const message = document.createElement("div");

    if (isOwn) {
        message.className = "message outgoing";
    } else {
        message.className = "message incoming";
    }

    let nameHtml =
        '<div style="font-size:11px;color:#c9b8f5;margin-bottom:3px;">' +
        senderName +
        '</div>';

    message.innerHTML =
        '<div class="bubble">' +
        nameHtml +
        msg.text +
        '<span class="time">' +
        formatTime(msg.createdAt) +
        '</span>' +
        '</div>';

    messagesEl.appendChild(message);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

socket.on("chatMessage", function (msg) {
    renderMessage(msg);
});

socket.on("new-message", function (msg) {
    renderMessage(msg);
});

function sendMessage() {
    const text = messageInput.value.trim();

    if (!text) {
        return;
    }

    if (roomName === null) {
        socket.emit("chatMessage", { text: text });
    } else {
        socket.emit("new-message", { text: text, roomName: roomName });
    }

    messageInput.value = "";
}

function getRoomId(emailA, emailB) {
    const emails = [emailA.toLowerCase(), emailB.toLowerCase()];
    emails.sort();
    return emails[0] + "_" + emails[1];
}

function openChat(user) {
    roomName = getRoomId(myEmail, user.email);

    messagesEl.innerHTML = "";
    document.getElementById("headerName").innerText = user.name;
    document.getElementById("headerAvatar").innerText = user.name.charAt(0).toUpperCase();

    const allItems = document.querySelectorAll(".chat-item");
    for (let i = 0; i < allItems.length; i++) {
        allItems[i].classList.remove("active");
    }

    const selectedItem = document.getElementById("user-" + user.id);
    if (selectedItem) {
        selectedItem.classList.add("active");
    }

    socket.emit("join-room", roomName);
}

function loadUsers() {
    axios.get("http://localhost:5000/api/users")
        .then(function (response) {
            const users = response.data;

            chatListEl.innerHTML = "";

            for (let i = 0; i < users.length; i++) {
                const user = users[i];

                const item = document.createElement("div");
                item.className = "chat-item";
                item.id = "user-" + user.id;

               item.innerHTML =
    '<div class="user-rectangle">' +
        user.name +
    '</div>';

                item.onclick = function () {
                    openChat(user);
                };

                chatListEl.appendChild(item);
            }
        })
        .catch(function (error) {
            console.error(error);
        });
}

loadUsers();