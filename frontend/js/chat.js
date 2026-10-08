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
const groupListEl = document.getElementById("groupList");

let roomName = null;
let currentGroup = null;

let allUsers = [];
let myGroups = [];

let selectionMode = false;
let selectedUserIds = [];

axios.defaults.headers.common["Authorization"] = "Bearer " + token;

const socket = io("http://localhost:5000", {
  auth: {
    token: token,
  },
});

socket.on("connect", function () {
  console.log("Connected to Socket.IO:", socket.id);
});

socket.on("connect_error", function (error) {
  console.log("Connection failed:", error.message);
});

// ESCAPE HTML (use for ANY user-provided text put into innerHTML)

function escapeHtml(text) {
  return String(text === undefined || text === null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTime(dateStr) {
  const d = new Date(dateStr);

  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderMessage(msg) {
  const isOwn = String(msg.senderId) === String(currentUserId);

  const message = document.createElement("div");

  if (isOwn) {
    message.className = "message outgoing";
  } else {
    message.className = "message incoming";
  }

  let senderName = "";

  if (msg.senderName) {
    senderName = msg.senderName;
  } else if (msg.User) {
    senderName = msg.User.name;
  }

  let nameHtml = "";

  if (senderName && !isOwn) {
    nameHtml = '<div class="sender-name">' + escapeHtml(senderName) + "</div>";
  }

  let contentHtml = "";

  if (msg.mediaUrl) {
    if (msg.mediaType && msg.mediaType.startsWith("image/")) {
      contentHtml =
        '<img src="' + escapeHtml(msg.mediaUrl) + '" class="chat-image">';
    } else {
      contentHtml =
        '<a href="' +
        escapeHtml(msg.mediaUrl) +
        '" target="_blank" rel="noopener noreferrer">' +
        "📎 " +
        escapeHtml(msg.fileName) +
        "</a>";
    }
  } else {
    contentHtml = "<div>" + escapeHtml(msg.text) + "</div>";
  }

  message.innerHTML =
    '<div class="bubble">' +
    nameHtml +
    contentHtml +
    '<span class="time">' +
    formatTime(msg.createdAt) +
    "</span>" +
    "</div>";

  messagesEl.appendChild(message);

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

socket.on("new-message", function (msg) {
  if (roomName === msg.roomName || !msg.roomName) {
    renderMessage(msg);

    const isOwn = String(msg.senderId) === String(currentUserId);

    if (!isOwn && msg.text) {
      fetchSmartReplies(msg.text);
    }
  }
});

// GROUP MESSAGE RECEIVED
// (matches what the backend actually emits: "group-message")

socket.on("group-message", function (msg) {
  if (currentGroup && currentGroup.id === msg.groupId) {
    renderMessage(msg);

    const isOwn = String(msg.senderId) === String(currentUserId);

    if (!isOwn && msg.text) {
      fetchSmartReplies(msg.text);
    }
  }
});

socket.on("system-message", function (msg) {
  if (currentGroup && String(currentGroup.id) === String(msg.groupId)) {
    const message = document.createElement("div");

    message.className = "system-message";

    message.innerText = msg.text;

    messagesEl.appendChild(message);

    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
});

// PRIVATE ROOM ID
function getRoomId(emailA, emailB) {
  const emails = [emailA.toLowerCase(), emailB.toLowerCase()];

  emails.sort();

  return emails[0] + "_" + emails[1];
}

// CLEAR ACTIVE STATE ON SIDEBAR

function clearActiveItems() {
  const allItems = document.querySelectorAll(".chat-item");

  for (let i = 0; i < allItems.length; i++) {
    allItems[i].classList.remove("active");
  }
}

// OPEN PRIVATE CHAT
function openChat(user) {
  currentGroup = null;

  roomName = getRoomId(myEmail, user.email);

  messagesEl.innerHTML = "";
  //resetSmartReplies();

  document.getElementById("headerName").innerText = user.name;

  document.getElementById("headerAvatar").innerText = user.name
    .charAt(0)
    .toUpperCase();

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
  axios
    .get("http://localhost:5000/api/messages/" + roomName)

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
  //resetSmartReplies();

  document.getElementById("headerName").innerText = group.name;

  document.getElementById("headerAvatar").innerText = group.name
    .charAt(0)
    .toUpperCase();

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
  axios
    .get("http://localhost:5000/api/groups/" + groupId + "/messages")

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
      '<div class="user-rectangle">' + escapeHtml(group.name) + "</div>";

    item.onclick = function () {
      openGroupChat(group);
    };

    groupListEl.appendChild(item);
  }
}

// LOAD MY GROUPS (persisted, survives a refresh)

function loadGroups() {
  axios
    .get("http://localhost:5000/api/groups")

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

  document.getElementById("groupCreateControls").style.display = selectionMode
    ? "block"
    : "none";
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

  axios
    .post("http://localhost:5000/api/groups", {
      name: groupName,
      memberIds: selectedUserIds,
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

  const availableUsers = allUsers.filter(function (user) {
    if (String(user.id) === String(currentUserId)) {
      return false;
    }

    const alreadyMember =
      currentGroup.members &&
      currentGroup.members.some(function (member) {
        return String(member.id) === String(user.id);
      });

    return !alreadyMember;
  });

  if (availableUsers.length === 0) {
    alert("All users are already members of this group.");
    return;
  }

  let list = "Available users:\n\n";

  for (let i = 0; i < availableUsers.length; i++) {
    list += availableUsers[i].name + " - " + availableUsers[i].email + "\n";
  }

  const email = prompt(list + "\nEnter the email of the user to add:");

  if (!email) {
    return;
  }

  const selectedUser = availableUsers.find(function (user) {
    return user.email.toLowerCase() === email.trim().toLowerCase();
  });

  if (!selectedUser) {
    alert("Invalid email or user is already in the group.");
    return;
  }

  axios
    .post(
      "http://localhost:5000/api/groups/" + currentGroup.id + "/members",
      {
        email: email.trim(),
      },
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      },
    )
    .then(function () {
      alert(selectedUser.name + " added to the group");

      // Refresh groups so the new member appears
      loadGroups();
    })
    .catch(function (error) {
      alert(
        error.response ? error.response.data.message : "Could not add member",
      );
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

  axios
    .post("http://localhost:5000/api/groups/" + groupId + "/leave")
    .then(function () {
      // Leave Socket.IO room
      socket.emit("leave-group", groupId);

      // Clear current group
      currentGroup = null;
      roomName = null;

      // Clear messages
      messagesEl.innerHTML = "";
      // resetSmartReplies();

      // Reset header
      document.getElementById("headerName").innerText = "Select a chat";
      document.getElementById("headerAvatar").innerText = "G";

      // Hide group buttons
      document.getElementById("addMemberBtn").style.display = "none";
      document.getElementById("leaveGroupBtn").style.display = "none";

      // Reload groups
      loadGroups();
    })
    .catch(function (error) {
      console.error("Leave group error:", error);

      alert(
        error.response ? error.response.data.message : "Could not leave group",
      );
    });
}

// AI SUGGESTIONS

const aiInput = document.getElementById("aiInput");
const getSuggestionsBtn = document.getElementById("getSuggestionsBtn");
const suggestionsContainer = document.getElementById("suggestionsContainer");
const toneSelect = document.getElementById("toneSelect");
const modeSelect = document.getElementById("modeSelect"); // "reply" or "compose"
const smartReplyChips = document.getElementById("smartReplyChips");

// TABS

function showAITab() {
  document.getElementById("aiTab").classList.add("active");
  document.getElementById("smartRepliesTab").classList.remove("active");

  document.getElementById("aiSuggestionsPanel").style.display = "block";
  document.getElementById("smartRepliesPanel").style.display = "none";
}

// GET AI SUGGESTIONS (manual button)
// mode comes from the dropdown:
//   "reply"   -> answers the text (e.g. "how are you?" -> "Good, you?")
//   "compose" -> rewrites / improves the text

async function getAISuggestions() {
  const text = aiInput.value.trim();

  if (!text) {
    alert("Write something first.");
    aiInput.focus();
    return;
  }

  const tone = toneSelect.value;
  const mode = modeSelect ? modeSelect.value : "reply";

  // Disable button
  getSuggestionsBtn.disabled = true;
  getSuggestionsBtn.innerText = "Generating...";

  // Clear previous suggestions
  suggestionsContainer.innerHTML =
    '<div class="ai-loading">✨ Gemini is generating suggestions...</div>';

  try {
    const response = await axios.post(
      "http://localhost:5000/api/ai/suggestions",
      {
        text: text,
        tone: tone,
        mode: mode,
      },
    );

    const suggestions = response.data.suggestions;

    displayAISuggestions(
      suggestions,
      suggestionsContainer,
      function (suggestion) {
        messageInput.value = suggestion;
        messageInput.focus();
      },
    );
  } catch (error) {
    console.error("AI suggestion error:", error);

    let errorMessage = "Could not generate suggestions.";

    if (error.response && error.response.status === 503) {
      errorMessage = "AI is busy right now. Please try again in a moment.";
    } else if (error.response && error.response.status === 429) {
      errorMessage = "AI limit reached. Please try again later.";
    }

    suggestionsContainer.innerHTML =
      '<div class="ai-error">' + escapeHtml(errorMessage) + "</div>";
  } finally {
    getSuggestionsBtn.disabled = false;
    getSuggestionsBtn.innerText = "Get AI Suggestions";
  }
}

// SMART REPLIES (auto, on incoming message — "reply" mode)

function fetchSmartReplies(incomingText) {
  smartReplyChips.innerHTML =
    '<div class="ai-loading">✨ Thinking of replies...</div>';

  axios
    .post("http://localhost:5000/api/ai/suggestions", {
      text: incomingText,
      tone: toneSelect.value,
      mode: "reply",
    })

    .then(function (response) {
      displayAISuggestions(
        response.data.suggestions,
        smartReplyChips,
        function (suggestion) {
          // Quick-select: send immediately, same as clicking a WhatsApp smart reply
          messageInput.value = suggestion;
          sendMessage();
        },
      );
    })

    .catch(function (error) {
      console.error("Smart replies error:", error);

      smartReplyChips.innerHTML =
        '<div class="ai-error">Could not generate replies.</div>';
    });
}

// DISPLAY SUGGESTIONS (shared by both panels)

function displayAISuggestions(suggestions, container, onPick) {
  container.innerHTML = "";

  if (!suggestions || suggestions.length === 0) {
    container.innerHTML =
      '<div class="ai-error">' + "No suggestions generated." + "</div>";

    return;
  }

  for (let i = 0; i < suggestions.length; i++) {
    const suggestion = document.createElement("div");

    suggestion.className = "suggestion-card";

    suggestion.innerHTML =
      '<div class="suggestion-title">' +
      "✨ Suggestion" +
      "</div>" +
      '<div class="suggestion-text">' +
      escapeHtml(suggestions[i]) +
      "</div>";

    suggestion.onclick = (function (text) {
      return function () {
        onPick(text);
      };
    })(suggestions[i]);

    container.appendChild(suggestion);
  }
}

// BUTTON CLICK

getSuggestionsBtn.addEventListener("click", function () {
  getAISuggestions();
});

// ENTER IN AI INPUT

aiInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();

    getAISuggestions();
  }
});

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
      text: text,
    });
  } else if (roomName) {
    socket.emit("new-message", {
      roomName: roomName,
      text: text,
      senderId: currentUserId,
      senderName: senderName,
    });
  }

  messageInput.value = "";
}

// ENTER KEY
messageInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

// FILE UPLOAD
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
      formData,
    );

    console.log("File uploaded:", response.data);

    sendMediaMessage(response.data.url, response.data.type, response.data.name);
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
      fileName: fileName,
    });
  } else if (roomName) {
    socket.emit("new-message", {
      roomName: roomName,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      fileName: fileName,
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
        user.id +
        '">';
    }

    item.innerHTML =
      checkboxHtml +
      '<div class="user-rectangle">' +
      escapeHtml(user.name) +
      "</div>";

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
  axios
    .get("http://localhost:5000/api/users")

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