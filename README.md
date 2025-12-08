# 🧠 RepoContext

> **The ultimate tool for preparing codebases for LLMs (ChatGPT, Claude, Gemini).**
> Turn any GitHub repository into a single, context-rich text file in seconds.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Privacy](https://img.shields.io/badge/Privacy-Local%20Processing-green)
![Stars](https://img.shields.io/github/stars/facebook/react?style=social)

## 🚀 Why RepoContext?

Developers spend hours copy-pasting code into ChatGPT to get help. **RepoContext solves this.** 

It smartly fetches your repository, filters out the noise (images, lock files, binaries), and formats it into a prompt-ready context file that AI models understand perfectly.

### ✨ Key Features

*   **⚡ Smart Filtering:** Automatically ignores `node_modules`, `.git`, images, and binaries. Saves you tokens and money.
*   **🌳 Interactive Tree:** Don't need the whole repo? Uncheck the folders you don't want before merging.
*   **🧠 Token Estimator:** See exactly how much context space your repo takes (optimized for GPT-4 & Claude 3.5).
*   **🎨 AI-Optimized Formats:**
    *   **Markdown:** Best for ChatGPT (syntax highlighting).
    *   **XML:** Best for Claude (strict structure).
    *   **Text:** Best for maximizing context size.
*   **🔒 Privacy First:** Your code **never** goes to our server. All processing happens locally in your browser.
*   **🔗 Magic Links:** Share a URL like `repocontext.com/facebook/react` to instantly share the context generation page.

## 🛠️ Usage

1.  **Enter Repo URL:** Paste `https://github.com/owner/repo`.
2.  **Scan:** Click "Fetch". We'll analyze the structure.
3.  **Select:** Uncheck files/folders you don't need (e.g., `tests/` or `docs/`).
4.  **Merge:** Click "Confirm & Merge".
5.  **Download:** Get your file and feed it to your favorite AI.

### 💡 Pro Tip: Rate Limits

GitHub limits anonymous requests to 60/hour. If you hit a limit:
1.  Click the **"Generate Token"** link in the app.
2.  Create a standard token (no special scopes needed for public repos).
3.  Paste it in. **This increases your limit to 5,000 requests/hour.**

## 📦 Installation (Run Locally)

If you want to run this yourself:

```bash
# Clone the repository
git clone https://github.com/your-username/RepoContext.git

# Install dependencies
npm install

# Start development server
npm start
```

## 🤝 Contributing

We love contributions! Feel free to submit Pull Requests or open Issues to suggest features like "Remove Comments" or "PDF Support".

---

*Built with ❤️ for the developer community.*