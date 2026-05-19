// =========================
// CURRENT CHAT
// =========================

let currentChatId = null

// =========================
// SEND MESSAGE
// =========================

async function sendMessage() {

    const input =
        document.getElementById("message-input")

    const chatBox =
        document.getElementById("chat-box")

    const message =
        input.value.trim()

    if (!message) return

    // REMOVE WELCOME

    const welcome =
        document.querySelector(".welcome-box")

    if (welcome) {
        welcome.remove()
    }

    // USER MESSAGE

    addMessage(message, "user")

    // CLEAR INPUT

    input.value = ""

    // TYPING

    const typing = addTyping()

    try {

        const response =
            await fetch("/chat", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: message
                })
            })

        const data =
            await response.json()

        typing.remove()

        addMessage(
            data.reply,
            "bot"
        )

        currentChatId =
            data.chat_id

        loadChatHistory()

    } catch (error) {

        typing.remove()

        addMessage(
            "Server error.",
            "bot"
        )

        console.error(error)
    }
}

// =========================
// ADD MESSAGE
// =========================

function addMessage(text, sender) {

    const chatBox =
        document.getElementById("chat-box")

    const messageDiv =
        document.createElement("div")

    messageDiv.classList.add("message")

    messageDiv.classList.add(sender)

    messageDiv.innerText = text

    chatBox.appendChild(messageDiv)

    chatBox.scrollTop =
        chatBox.scrollHeight
}

// =========================
// TYPING
// =========================

function addTyping() {

    const chatBox =
        document.getElementById("chat-box")

    const typing =
        document.createElement("div")

    typing.classList.add("message")

    typing.classList.add("bot")

    typing.innerText =
        "Nyara sedang mengetik..."

    chatBox.appendChild(typing)

    chatBox.scrollTop =
        chatBox.scrollHeight

    return typing
}

// =========================
// ENTER KEY
// =========================

function handleKey(event) {

    if (event.key === "Enter") {

        sendMessage()
    }
}

// =========================
// NEW CHAT
// =========================

async function newChat() {

    try {

        const response =
            await fetch("/new_chat", {

                method: "POST"
            })

        const data =
            await response.json()

        currentChatId =
            data.chat_id

        const chatBox =
            document.getElementById("chat-box")

        chatBox.innerHTML = `

            <div class="welcome-box">

                <img
                    src="/static/nyara_avatar.png"
                    class="welcome-avatar"
                >

                <h2>Haii! 👋</h2>

                <p>
                    Aku Nyara, AI companion kamu ✨
                </p>

            </div>
        `

        loadChatHistory()

        closeSidebar()

    } catch (error) {

        console.error(error)
    }
}

// =========================
// LOAD HISTORY
// =========================

async function loadChatHistory() {

    try {

        const response =
            await fetch("/get_chats")

        const chats =
            await response.json()

        const historyBox =
            document.getElementById("chat-history")

        historyBox.innerHTML = ""

        chats.reverse().forEach(chat => {

            const item =
                document.createElement("div")

            item.classList.add("history-item")

            item.innerText =
                chat.title

            item.onclick = () => {

                loadChat(chat.chat_id)

                closeSidebar()
            }

            historyBox.appendChild(item)
        })

    } catch (error) {

        console.error(error)
    }
}

// =========================
// LOAD CHAT
// =========================

async function loadChat(chatId) {

    try {

        currentChatId = chatId

        const response =
            await fetch(`/load_chat/${chatId}`)

        const messages =
            await response.json()

        const chatBox =
            document.getElementById("chat-box")

        chatBox.innerHTML = ""

        messages.forEach(msg => {

            addMessage(
                msg.content,
                msg.role === "user"
                    ? "user"
                    : "bot"
            )
        })

    } catch (error) {

        console.error(error)
    }
}

// =========================
// SIDEBAR TOGGLE
// =========================

function toggleSidebar() {

    const sidebar =
        document.querySelector(".sidebar")

    const overlay =
        document.getElementById("overlay")

    sidebar.classList.toggle(
        "sidebar-open"
    )

    overlay.classList.toggle(
        "overlay-show"
    )
}

// =========================
// CLOSE SIDEBAR
// =========================

function closeSidebar() {

    const sidebar =
        document.querySelector(".sidebar")

    const overlay =
        document.getElementById("overlay")

    sidebar.classList.remove(
        "sidebar-open"
    )

    overlay.classList.remove(
        "overlay-show"
    )
}

// =========================
// INIT
// =========================

loadChatHistory()