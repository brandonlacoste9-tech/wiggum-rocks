# Wiggum.Rocks 🎸

> **The Hybrid AI Surgical Engine.**

### 🔴 **LIVE DEMO:** [https://wiggum-rocks.vercel.app](https://wiggum-rocks.vercel.app)

This is a proof-of-concept IDE that uses a "Local Brain" (Ollama/Ralph) for syntax/basic fixes and a "Cloud Brain" (Gemini/Lisa) for complex reasoning, gated by a license system.

## 🚀 Quick Start

1.  **Install & Pull Model:**
    ```bash
    npm install
    make pull
    ```

2.  **Generate License:**
    ```bash
    node generateLicense.js enterprise "Admin"
    # Copy the token!
    ```

3.  **Launch:**
    ```bash
    make up
    ```

4.  **Access:**
    *   **Arcade:** [http://localhost:4000](http://localhost:4000)
    *   **Activation:** [http://localhost:4000/activate](http://localhost:4000/activate)

## 🏗 Architecture

*   **Frontend:** React (Vite) + Nes.css style
*   **Backend:** Express + JWT Middleware
*   **AI:** 
    *   Local: Ollama (Qwen 2.5)
    *   Cloud: Google Gemini Pro
*   **Orchestration:** Docker Compose

## 🕵️‍♂️ Debugging
*   **UI Logs:** F12 Console
*   **Container Logs:** `make logs`

---
*Built with ❤️ by Antigravity.*
