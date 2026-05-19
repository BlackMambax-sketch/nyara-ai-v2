import os
import uuid

from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify
from huggingface_hub import InferenceClient

# =========================
# LOAD ENV
# =========================

load_dotenv()

# =========================
# FLASK
# =========================

app = Flask(__name__)

# =========================
# HUGGINGFACE CLIENT
# =========================

client = InferenceClient(
    api_key=os.getenv("HF_TOKEN")
)

# =========================
# CHAT STORAGE
# =========================

chat_sessions = {}

current_chat_id = None

# =========================
# SYSTEM PROMPT
# =========================

SYSTEM_PROMPT = """
Kamu adalah Nyara.

Nyara adalah AI assistant yang:
- ramah
- natural
- cepat
- santai
- modern
- suka membantu

Jawab dengan natural seperti manusia.
Gunakan bahasa Indonesia yang santai dan enak dibaca.
Jawaban harus menyesuaikan pertanyaan user.
Kalau pertanyaannya pendek, jawab singkat.
Kalau pertanyaannya kompleks, jawab lengkap.
"""

# =========================
# HOME
# =========================

@app.route("/")
def home():
    return render_template("index.html")

# =========================
# NEW CHAT
# =========================

@app.route("/new_chat", methods=["POST"])
def new_chat():

    global current_chat_id

    chat_id = str(uuid.uuid4())

    current_chat_id = chat_id

    chat_sessions[chat_id] = []

    return jsonify({
        "chat_id": chat_id
    })

# =========================
# GET CHATS
# =========================

@app.route("/get_chats")
def get_chats():

    chats = []

    for chat_id, messages in chat_sessions.items():

        title = "New Chat"

        for msg in messages:

            if msg["role"] == "user":

                title = msg["content"][:30]

                break

        chats.append({
            "chat_id": chat_id,
            "title": title
        })

    chats.reverse()

    return jsonify(chats)

# =========================
# LOAD CHAT
# =========================

@app.route("/load_chat/<chat_id>")
def load_chat(chat_id):

    messages = chat_sessions.get(chat_id, [])

    return jsonify(messages)

# =========================
# CHAT API
# =========================

@app.route("/chat", methods=["POST"])
def chat():

    global current_chat_id

    data = request.get_json()

    user_message = data.get("message", "").strip()

    # =========================
    # EMPTY MESSAGE
    # =========================

    if not user_message:

        return jsonify({
            "reply": "Pesan kosong."
        })

    # =========================
    # CREATE NEW CHAT
    # =========================

    if not current_chat_id:

        current_chat_id = str(uuid.uuid4())

        chat_sessions[current_chat_id] = []

    # =========================
    # GET CURRENT CHAT
    # =========================

    messages = chat_sessions[current_chat_id]

    # =========================
    # SAVE USER MESSAGE
    # =========================

    messages.append({
        "role": "user",
        "content": user_message
    })

    # =========================
    # LIMIT MEMORY
    # =========================

    recent_messages = messages[-8:]

    # =========================
    # FINAL MESSAGES
    # =========================

    final_messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT
        }
    ] + recent_messages

    try:

        # =========================
        # DYNAMIC TOKEN SYSTEM
        # =========================

        message_length = len(user_message)

        if message_length < 20:

            dynamic_tokens = 120

        elif message_length < 80:

            dynamic_tokens = 250

        elif message_length < 200:

            dynamic_tokens = 500

        else:

            dynamic_tokens = 800

        # =========================
        # AI RESPONSE
        # =========================

        completion = client.chat.completions.create(

            model="deepseek-ai/DeepSeek-V4-Pro",

            messages=final_messages,

            max_tokens=dynamic_tokens,

            temperature=0.7,

            top_p=0.9,
        )

        bot_reply = completion.choices[0].message.content.strip()

        # =========================
        # SAVE BOT MESSAGE
        # =========================

        messages.append({
            "role": "assistant",
            "content": bot_reply
        })

        # =========================
        # RETURN RESPONSE
        # =========================

        return jsonify({
            "reply": bot_reply,
            "chat_id": current_chat_id
        })

    except Exception as e:

        return jsonify({
            "reply": f"Error: {str(e)}"
        })

# =========================
# RUN
# =========================

if __name__ == "__main__":

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )