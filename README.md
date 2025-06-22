# 💰 Take Home Pay Calculator (PWA)

A Progressive Web App (PWA) that helps users estimate their net income based on salary, pay frequency, dependents, and 401(k) contributions. Built using Flask and designed to work seamlessly across desktop and mobile devices — including installable support with dark mode and offline capabilities.

## 🌟 Features

- 🔄 Dark mode toggle with local storage
- 📱 Mobile-friendly responsive UI
- 📥 Installable as a PWA (Add to Home Screen)
- 🌐 Works online and caches for offline use
- 🧮 Real-time salary, tax, and 401(k) net pay calculation

## 🖥️ Tech Stack

- Python + Flask
- HTML + CSS + JavaScript
- PWA (manifest + service worker)
- Render (hosting)

---

## 🚀 Getting Started

### 🔧 Installation (Local)

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/take-home-pwa.git
   cd take-home-pwa
   
2. Install dependencies

pip install -r requirements.txt

3. Run the app
   
python app.py

4. Visit in your browser

http://localhost:5000

Project Structure

├── app.py                  # Flask backend
├── requirements.txt
├── static/
│   ├── styles.css
│   ├── manifest.json
│   ├── service-worker.js
│   ├── icon-192.png
│   └── icon-512.png
├── templates/
│   └── index.html

Add Your Own Calculator Icon

1. To change the app icon:

2. Replace icon-192.png and icon-512.png in static/

3. Update manifest.json if filenames change

4. Rebuild and redeploy

Deploy to Render

1. Push your repo to GitHub

2. Connect it to Render.com

3. Set your render.yaml and ensure:

   .  Python version specified (via runtime.txt or render.yaml)

   .  Start command: python app.py

License

MIT License

Author
Created by @jb24000








