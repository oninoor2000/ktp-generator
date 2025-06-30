# KTP Generator

Generator data KTP dan KTA Indonesia dengan data regional yang akurat menggunakan backend API.

## Features

- 🎯 Generate data KTP dan KTA sesuai format resmi Indonesia
- 🌍 Data regional akurat (Provinsi, Kabupaten, Kecamatan, Kelurahan)
- 📊 Export ke Excel dan PDF
- 🎨 Modern UI dengan Tailwind CSS
- ⚡ Fast dengan Vite + React + TypeScript
- 🔒 Type-safe dengan TypeScript

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Routing**: TanStack Router
- **Data**: Faker.js + Backend API
- **Export**: xlsx + jsPDF

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

1. Pilih provinsi dari dropdown
2. Tentukan jumlah data yang ingin di-generate
3. Pilih jenis kartu (KTP/KTA)
4. Klik "Generate Data"
5. Export ke Excel atau PDF

## API Endpoints

Backend API yang dibutuhkan:

```
GET /api/provinces           # Daftar provinsi
POST /api/regions/random     # Generate data regional random
```

## Environment Variables

```env
VITE_BACKEND_API_URL=http://localhost:3001/api
```

## Project Structure

```
src/
├── components/          # UI components
├── routes/             # Page routes
├── service/            # API services
├── lib/               # Utilities & types
└── assets/            # Static assets
```

## License

MIT License
