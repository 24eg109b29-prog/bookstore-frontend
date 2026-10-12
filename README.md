# PageTurner Bookstore — Frontend

Responsive web storefront for the PageTurner Online Bookstore application, built with semantic **HTML5, modern CSS3, and vanilla JavaScript**.

---

## 📖 Features
- **Curated Catalog**: Displays books with responsive cards and graceful typographic fallback covers.
- **Search & Filter**: Real-time search across title, author, and categories, plus multi-criteria sorting.
- **Interactive Shopping Cart**: Add books, adjust quantities, calculate live subtotals, and stock constraints.
- **Checkout Modal**: Simple order submission form with instant feedback and order confirmation.
- **Mobile-Responsive**: Tailored views for desktop, tablet, and mobile displays.

---

## 🚀 Running Locally

You can serve this frontend using any static web server:

### Option 1: Using VS Code Live Server
Right-click `index.html` and select **"Open with Live Server"**.

### Option 2: Using Node.js / npx
```bash
npx serve .
```

### Option 3: Direct Browser Launch
Double-click `index.html` to open it in your browser.

---

## 🔗 Backend API Connection
By default, API requests point to `/api` (or relative path).
When hosting the backend separately (e.g. on Render, Railway, or AWS):
You can configure the backend URL in `app.js` or via proxy.
The backend has CORS enabled to support cross-origin requests.

---

## 🌐 Deploying Frontend
You can deploy this static frontend with 1 click to:
- **Vercel** (`vercel deploy`)
- **Netlify** (Drag and drop or connect GitHub repository)
- **GitHub Pages** (Settings > Pages > Deploy from `main` branch)
