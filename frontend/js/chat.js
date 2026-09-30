const token = localStorage.getItem("chattoken");
const myEmail = localStorage.getItem("email");

if (!token || !myEmail) {
    window.location.href = "signin.html";
}

function parseJwt(jwtToken) {

    try {

        return JSON.parse(
            atob(jwtToken.split(".")[1])
        );

    } catch (error) {

        return null;

    }
}

const currentUser = parseJwt(token);

const currentUserId = currentUser
    ? currentUser.userId
    : null;

const messageInput =
    document.getElementById("msgInput");

const messagesEl =
    document.getElementById("messages");

const chatListEl =
    document.getElementById("chatList");

const groupListEl =
    document.getElementById("groupList");

let roomName = null;
let currentGroup = null;

let allUsers = [];
let myGroups = []; 

let selectionMode = false;
let selectedUserIds = [];

axios.defaults.headers.common["Authorization"] =
    "Bearer " + token;

const socket = io("http://localhost:5000", {

    auth: {
        token: token
    }

});


socket.on("connect", function () {

    console.log(
        "Connected to Socket.IO:",
        socket.id
    );

});


socket.on("connect_error", function (error) {

    console.log(
        "Connection failed:",
        error.message
    );

});

function formatTime(dateStr) {

    const d = new Date(dateStr);

    return d.toLocaleTimeString([], {

        hour: "2-digit",

        minute: "2-digit"

    });

}

function renderMessage(msg) {

    const isOwn =
        String(msg.senderId) ===
        String(currentUserId);


    const message =
        document.createElement("div");


    if (isOwn) {

        message.className =
            "message outgoing";

    } else {

        message.className =
            "message incoming";

    }


    let senderName = "";

    if (msg.senderName) {

        senderName = msg.senderName;

    } else if (msg.User) {

        senderName = msg.User.name;

    }


    let nameHtml = "";

    if (senderName && !isOwn) {

        nameHtml =
            '<div class="sender-name">' +
            senderName +
            '</div>';

    }
    let contentHtml = "";

if (msg.mediaUrl) {

    if (msg.mediaType && msg.mediaType.startsWith("image/")) {

        contentHtml =
            '<img src="' +
            msg.mediaUrl +
            '" class="chat-image">';

    } else {

        contentHtml =
            '<a href="' +
            msg.mediaUrl +
            '" target="_blank">' +
            "📎 " +
            msg.fileName +
            "</a>";

    }

} else {

    contentHtml =
        "<div>" +
        msg.text +
        "</div>";

}


   message.innerHTML =

    '<div class="bubble">' +

    nameHtml +

    contentHtml +

    '<span class="time">' +
    formatTime(msg.createdAt) +
    '</span>' +

    '</div>';


    messagesEl.appendChild(message);

    messagesEl.scrollTop =
        messagesEl.scrollHeight;

}

socket.on(
    "new-message",
    function (msg) {

        if (
            roomName === msg.roomName ||
            !msg.roomName
        ) {

            renderMessage(msg);

        }

    }
);

// GROUP MESSAGE RECEIVED
// (matches what the backend actually emits: "group-message")

socket.on(
    "group-message",
    function (msg) {

        if (currentGroup && currentGroup.id === msg.groupId) {

            renderMessage(msg);

        }

    }
);

socket.on("system-message", function (msg) {

    if (
        currentGroup &&
        String(currentGroup.id) === String(msg.groupId)
    ) {

        const message = document.createElement("div");

        message.className = "system-message";

        message.innerText = msg.text;

        messagesEl.appendChild(message);

        messagesEl.scrollTop =
            messagesEl.scrollHeight;
    }

});

// PRIVATE ROOM ID
function getRoomId(emailA, emailB) {

    const emails = [
        emailA.toLowerCase(),
        emailB.toLowerCase()
    ];

    emails.sort();

    return emails[0] + "_" + emails[1];

}
// CLEAR ACTIVE STATE ON SIDEBAR


function clearActiveItems() {

    const allItems =
        document.querySelectorAll(".chat-item");

    for (let i = 0; i < allItems.length; i++) {

        allItems[i].classList.remove("active");

    }

}

// OPEN PRIVATE CHAT
function openChat(user) {

    currentGroup = null;

    roomName = getRoomId(myEmail, user.email);

    messagesEl.innerHTML = "";

    document.getElementById("headerName").innerText = user.name;

    document.getElementById("headerAvatar").innerText =
        user.name.charAt(0).toUpperCase();

   document.getElementById("addMemberBtn").style.display = "none";
   document.getElementById("leaveGroupBtn").style.display = "none";

    clearActiveItems();

    const selectedItem = document.getElementById("user-" + user.id);
    if (selectedItem) {
        selectedItem.classList.add("active");
    }

    console.log("Joining private room:", roomName);

    socket.emit("join-room", roomName);

    loadPrivateHistory(roomName);

}

// LOAD PRIVATE MESSAGE HISTORY

function loadPrivateHistory(roomName) {

    axios.get("http://localhost:5000/api/messages/" + roomName)

        .then(function (response) {

            const messages = response.data;

            for (let i = 0; i < messages.length; i++) {
                renderMessage(messages[i]);
            }

        })

        .catch(function (error) {

            console.error("Error loading history:", error);

        });

}
// OPEN GROUP CHAT
function openGroupChat(group) {

    roomName = null;

    currentGroup = group;

    messagesEl.innerHTML = "";

    document.getElementById("headerName").innerText = group.name;

    document.getElementById("headerAvatar").innerText =
        group.name.charAt(0).toUpperCase();

   document.getElementById("addMemberBtn").style.display = "inline-block";
   document.getElementById("leaveGroupBtn").style.display = "inline-block";

    clearActiveItems();

    const selectedItem = document.getElementById("group-" + group.id);
    if (selectedItem) {
        selectedItem.classList.add("active");
    }

    console.log("Joining group:", group.name);

    socket.emit("join-group", group.id);

    loadGroupHistory(group.id);

}

// LOAD GROUP MESSAGE HISTORY

function loadGroupHistory(groupId) {

    axios.get("http://localhost:5000/api/groups/" + groupId + "/messages")

        .then(function (response) {

            const messages = response.data;

            for (let i = 0; i < messages.length; i++) {
                renderMessage(messages[i]);
            }

        })

        .catch(function (error) {

            console.error("Error loading group history:", error);

        });

}

// RENDER GROUP LIST
function renderGroupList() {

    groupListEl.innerHTML = "";

    for (let i = 0; i < myGroups.length; i++) {

        const group = myGroups[i];

        const item = document.createElement("div");
        item.className = "chat-item";
        item.id = "group-" + group.id;

        item.innerHTML =
            '<div class="user-rectangle">' + group.name + '</div>';

        item.onclick = function () {
            openGroupChat(group);
        };

        groupListEl.appendChild(item);

    }

}
// LOAD MY GROUPS (persisted, survives a refresh)

function loadGroups() {

    axios.get("http://localhost:5000/api/groups")

        .then(function (response) {

            myGroups = response.data;
            renderGroupList();

        })

        .catch(function (error) {

            console.error("Error loading groups:", error);

        });

}

// CREATE GROUP (select members first)
function toggleSelectionMode() {

    selectionMode = !selectionMode;
    selectedUserIds = [];

    renderUserList();

    document.getElementById("groupCreateControls").style.display =
        selectionMode ? "block" : "none";

}


function toggleUserSelected(userId) {

    const index = selectedUserIds.indexOf(userId);

    if (index === -1) {
        selectedUserIds.push(userId);
    } else {
        selectedUserIds.splice(index, 1);
    }

}


function confirmCreateGroup() {

    const nameInput = document.getElementById("newGroupName");
    const groupName = nameInput.value.trim();

    if (!groupName) {
        alert("Enter a group name");
        return;
    }

    if (selectedUserIds.length === 0) {
        alert("Select at least one member");
        return;
    }

    axios.post("http://localhost:5000/api/groups", {
        name: groupName,
        memberIds: selectedUserIds
    })

        .then(function (response) {

            nameInput.value = "";
            toggleSelectionMode();

            loadGroups();
            openGroupChat(response.data);

        })

        .catch(function (error) {

            console.error("Error creating group:", error);

        });

}


// ADD A USER TO THE OPEN GROUP

function addMemberPrompt() {

    if (!currentGroup) {
        return;
    }

    let list = "Enter the ID of the user to add:\n";

    for (let i = 0; i < allUsers.length; i++) {
        list += allUsers[i].id + " - " + allUsers[i].name + "\n";
    }

    const userId = prompt(list);

    if (!userId) {
        return;
    }

    axios.post("http://localhost:5000/api/groups/" + currentGroup.id + "/members", {
        userId: Number(userId)
    })

        .then(function () {

            alert("Member added");

        })

        .catch(function (error) {

            alert(error.response ? error.response.data.message : "Could not add member");

        });

}

function leaveCurrentGroup() {

    if (!currentGroup) {
        return;
    }

    const groupId = currentGroup.id;

    if (!confirm("Are you sure you want to leave this group?")) {
        return;
    }

    axios.post(
        "http://localhost:5000/api/groups/" +
        groupId +
        "/leave"
    )
    .then(function () {

        // Leave Socket.IO room
        socket.emit("leave-group", groupId);

        // Clear current group
        currentGroup = null;
        roomName = null;

        // Clear messages
        messagesEl.innerHTML = "";

        // Reset header
        document.getElementById("headerName").innerText =
            "Select a chat";

        document.getElementById("headerAvatar").innerText =
            "G";

        // Hide group buttons
        document.getElementById("addMemberBtn").style.display =
            "none";

        document.getElementById("leaveGroupBtn").style.display =
            "none";

        // Reload groups
        loadGroups();

    })
    .catch(function (error) {

        console.error("Leave group error:", error);

        alert(
            error.response
                ? error.response.data.message
                : "Could not leave group"
        );

    });
}
// SEND MESSAGE
function sendMessage() {

    const text = messageInput.value.trim();

    if (!text) {
        return;
    }

    const senderName = localStorage.getItem("name");

    if (currentGroup) {

        socket.emit("group-message", {
            groupId: currentGroup.id,
            text: text
        });

    } else if (roomName) {

        socket.emit("new-message", {
            roomName: roomName,
            text: text,
            senderId: currentUserId,
            senderName: senderName
        });

    }

    messageInput.value = "";

}
// ENTER KEY
messageInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }

    }
);

const fileInput = document.getElementById("fileInput");
async function uploadFile() {

    const file = fileInput.files[0];

    if (!file) {
        return;
    }

    const formData = new FormData();

    formData.append("file", file);

    try {

        const response = await axios.post(
            "http://localhost:5000/api/upload",
            formData
        );

        console.log("File uploaded:", response.data);

        sendMediaMessage(
            response.data.url,
            response.data.type,
            response.data.name
        );

    } catch (error) {

        console.error("Upload failed:", error);

        alert("File upload failed");

    }

    fileInput.value = "";
}
function sendMediaMessage(mediaUrl, mediaType, fileName) {

    if (currentGroup) {

        socket.emit("group-message", {

            groupId: currentGroup.id,

            mediaUrl: mediaUrl,

            mediaType: mediaType,

            fileName: fileName

        });

    } else if (roomName) {

        socket.emit("new-message", {

            roomName: roomName,

            mediaUrl: mediaUrl,

            mediaType: mediaType,

            fileName: fileName

        });

    }

}
// RENDER USER LIST
function renderUserList() {

    chatListEl.innerHTML = "";

    for (let i = 0; i < allUsers.length; i++) {

        const user = allUsers[i];

        if (String(user.id) === String(currentUserId)) {
            continue;
        }

        const item = document.createElement("div");
        item.className = "chat-item";
        item.id = "user-" + user.id;

        let checkboxHtml = "";
        if (selectionMode) {
            checkboxHtml =
                '<input type="checkbox" class="form-check-input me-2" data-user-id="' +
                user.id + '">';
        }

        item.innerHTML =
            checkboxHtml +
            '<div class="user-rectangle">' + user.name + '</div>';

        if (selectionMode) {

            const checkbox = item.querySelector("input[type=checkbox]");

            checkbox.onclick = function (event) {
                event.stopPropagation();
                toggleUserSelected(user.id);
            };

            item.onclick = function () {
                checkbox.checked = !checkbox.checked;
                toggleUserSelected(user.id);
            };

        } else {

            item.onclick = function () {
                openChat(user);
            };

        }

        chatListEl.appendChild(item);

    }

}
// LOAD USERS

function loadUsers() {

    axios.get("http://localhost:5000/api/users")

        .then(function (response) {

            allUsers = response.data;
            renderUserList();

        })

        .catch(function (error) {

            console.error("Error loading users:", error);

        });

}
loadUsers();
loadGroups();