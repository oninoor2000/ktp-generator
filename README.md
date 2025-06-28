# 🆔 Generator Data KTP & KTA Indonesia

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/oninoor2000/ktp-generator)
[![GitHub license](https://img.shields.io/github/license/oninoor2000/ktp-generator)](https://github.com/oninoor2000/ktp-generator/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/oninoor2000/ktp-generator)](https://github.com/oninoor2000/ktp-generator/stargazers)

Aplikasi web gratis untuk generate data dummy KTP (Kartu Tanda Penduduk) dan KTA (Kartu Tanda Pengenal Anak) Indonesia. Cocok untuk keperluan testing, development, dan mockup aplikasi.

## ✨ Fitur

- 🎯 **Generate Data KTP Indonesia** - Lengkap dengan NIK, nama, alamat, dan informasi sesuai format resmi
- 👶 **Generate Data KTA Indonesia** - Data kartu tanda pengenal untuk anak-anak dengan format yang sesuai
- 🌍 **Semua Provinsi Indonesia** - Pilih data dari seluruh provinsi di Indonesia
- 📊 **Export ke Excel** - Download hasil generate dalam format .xlsx
- 🎛️ **Pengaturan Fleksibel** - Atur jumlah data, usia, gender, dan provinsi
- 🎨 **UI Modern** - Interface yang clean dan responsive
- ⚡ **Performa Cepat** - Generate ribuan data dalam hitungan detik
- 🌙 **Dark/Light Theme** - Pilihan tema gelap dan terang

## 🚀 Demo

Lihat aplikasi live di: [https://ktp-generator.vercel.app](https://ktp-generator.vercel.app)

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS v4, Radix UI
- **State Management**: React Hook Form, Immer
- **Build Tool**: Vite
- **Deployment**: Vercel

## 📦 Instalasi

### Prerequisites

- Node.js 18+
- npm atau pnpm

### Clone Repository

```bash
git clone https://github.com/oninoor2000/ktp-generator.git
cd ktp-generator
```

### Install Dependencies

```bash
npm install
# atau
pnpm install
```

### Development

```bash
npm run dev
# atau
pnpm dev
```

Buka [http://localhost:5173](http://localhost:5173) di browser.

### Build Production

```bash
npm run build
# atau
pnpm build
```

## 📋 Penggunaan

1. **Pilih Jenis Data**: KTP atau KTA
2. **Atur Pengaturan**:
   - Jumlah data yang ingin di-generate (1-1000)
   - Rentang usia (min-max)
   - Gender (Laki-laki, Perempuan, atau Keduanya)
   - Pilih provinsi (bisa multiple selection)
3. **Generate Data**: Klik tombol "Generate Data"
4. **Export**: Download hasil dalam format Excel

## 🔒 Disclaimer

⚠️ **PENTING**: Data yang dihasilkan adalah **DUMMY/PALSU** dan hanya untuk keperluan:

- Testing aplikasi
- Development/mockup
- Pembelajaran
- Demo/presentasi

**DILARANG** menggunakan data ini untuk:

- Dokumen resmi
- Penipuan atau fraud
- Aktivitas ilegal
- Menyesatkan pihak lain

## 📄 Struktur Data

### Data KTP

- NIK (16 digit sesuai format Indonesia)
- Nama Lengkap
- Tempat/Tanggal Lahir
- Jenis Kelamin
- Alamat Lengkap (RT/RW, Kelurahan, Kecamatan)
- Kota/Kabupaten
- Provinsi
- Agama
- Status Perkawinan
- Pekerjaan
- Golongan Darah

### Data KTA

- Semua field KTP +
- Nomor KK
- Nama Kepala Keluarga
- Nomor Akte Kelahiran
- Masa Berlaku

## 🤝 Contributing

Kontribusi sangat diterima! Silakan:

1. Fork repository ini
2. Buat branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👨‍💻 Author

**Oni Noor**

- GitHub: [@oninoor2000](https://github.com/oninoor2000)
- Website: [https://ktp-generator.vercel.app](https://ktp-generator.vercel.app)

## 🙏 Acknowledgments

- Data provinsi dan kota berdasarkan data resmi Indonesia
- UI components dari [Radix UI](https://www.radix-ui.com/)
- Icons dari [Lucide React](https://lucide.dev/)

---

## 🌟 Star History

Jika aplikasi ini membantu, jangan lupa berikan ⭐ di repository ini!

[![Star History Chart](https://api.star-history.com/svg?repos=oninoor2000/ktp-generator&type=Date)](https://star-history.com/#oninoor2000/ktp-generator&Date)
