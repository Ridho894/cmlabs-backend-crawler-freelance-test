# cmlabs Backend Crawler — Freelance Test

Web crawler yang mendukung website bertipe **SPA**, **SSR**, dan **PWA** menggunakan [Playwright](https://playwright.dev/) (headless Chromium). Hasil crawl disimpan sebagai file HTML.

## Tech Stack

- **Runtime**: Node.js
- **Browser Automation**: Playwright (Chromium) — handles JS-rendered SPA/PWA
- **API Server**: Express.js

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

> `postinstall` otomatis menjalankan `playwright install chromium`.

---

### 2. Crawl semua target website

```bash
npm run crawl
# atau
node index.js
```

File HTML hasil crawl tersimpan di folder `output/`.

---

### 3. Jalankan sebagai API server

```bash
npm run serve
# atau
node index.js serve
```

Server berjalan di `http://localhost:3000` (ubah port via env `PORT`).

---

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/` | Info API dan daftar endpoint |
| `POST` | `/api/crawl` | Crawl satu URL |
| `POST` | `/api/crawl-all` | Crawl semua target yang sudah ditentukan |

### POST `/api/crawl`

**Request body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Crawled and saved as example_com.html",
  "url": "https://example.com",
  "filename": "example_com.html",
  "filepath": "/absolute/path/to/output/example_com.html",
  "size": 123456
}
```

---

## Target Website

| No | Website | Keterangan |
|----|---------|------------|
| 1 | [cmlabs.co](https://cmlabs.co) | Required |
| 2 | [sequence.day](https://sequence.day) | Required |
| 3 | [tailwindcss.com](https://tailwindcss.com) | Bebas (free choice) |

---

## Output Files

Tersimpan di folder `output/`:

```
output/
├── cmlabs_co.html
├── sequence_day.html
└── tailwindcss_com.html
```

---

## Cara Kerja

1. Playwright meluncurkan browser **Chromium** secara headless
2. Navigasi ke target URL
3. Menunggu status **`networkidle`** — semua request jaringan selesai, memastikan konten SPA/PWA yang di-render oleh JavaScript sudah termuat
4. Menunggu 2 detik tambahan untuk komponen lazy-load
5. Mengambil HTML final via `page.content()`
6. Menyimpan ke file `.html` di folder `output/`
