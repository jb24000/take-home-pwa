# 🧮 Take Home Pay Calculator (PWA)

A responsive, installable **Progressive Web App (PWA)** built with **Flask** that calculates your net income based on salary, dependents, and 401(k) contributions.

✅ **Features**
- 🌓 Dark mode toggle
- 📱 Installable on mobile as a PWA
- 📊 Federal + State tax + 401(k) deduction calculations
- 🔁 Works offline using Service Worker
- 🖥️ Deployable on [Render](https://render.com)

---

## 🚀 Live Demo

🌐 [https://take-home-pwa-5qbe.onrender.com](https://take-home-pwa-5qbe.onrender.com)

---

## 📦 Project Structure

├── app.py # Flask backend logic

├── build.sh # Build command for Render

├── render.yaml # Render deployment settings

├── requirements.txt # Python dependencies

├── static/ # CSS, JS, PWA icons, manifest

│ ├── styles.css

│ ├── icon-192.png

│ ├── icon-512.png

│ ├── manifest.json

│ └── service-worker.js

└── templates/

└── index.html # Main HTML template


---

## 📲 Installation

### 🐍 Local Development

1. Clone the repo:

```bash

git clone https://github.com/YOUR_USERNAME/take-home-pwa.git
cd take-home-pwa

2. Create virtual environment and install dependencies:

python -m venv venv
venv\\Scripts\\activate   # On Windows
source venv/bin/activate  # On Mac/Linux

pip install -r requirements.txt

python -m venv venv
venv\\Scripts\\activate   # On Windows
source venv/bin/activate  # On Mac/Linux

pip install -r requirements.txt

3. Run the app:

python app.py

🌐 Deploying to Render
1. Push to GitHub

2. Connect GitHub to Render

3. Render detects render.yaml and auto-deploys

📱 Add to Home Screen (PWA)
1. Open the site on your mobile browser

2. Tap "Add to Home Screen"

3. App will install with calculator icon and launch full screen

🧩 Updating Dropbox-linked PDFs (Optional)
If hosting project PDFs externally (like Dropbox):

1. Generate a public raw=1 share link

2. Add <a href="DROPBOX_LINK"><img src="THUMBNAIL_IMAGE" /></a> in your HTML

3. Push changes to GitHub and Render

🛠️ Todo
. Add PDF export of results

. Add state selection for tax rate auto-detection

. Mobile layout refinements

📄 License
MIT — Free to use with attribution







