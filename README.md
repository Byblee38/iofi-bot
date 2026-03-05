# Iofi Radio Discord Bot

Bot sederhana yang memutar MP3 dari folder `songs` di voice channel Discord. Dirancang untuk streaming musik 24/7 dan dikendalikan melalui perintah di chat.

---
## 🔧 Persiapan

1. Clone repo dan install dependensi:
   ```bash
   npm install
   ```

2. Buat file `.env` di root dengan isi:
   ```env
   DISCORD_TOKEN=token_bot_kamu
   GUILD_ID=<opsional>
   CHANNEL_ID=<opsional>
   ```
   > **NOTE:** Hanya `DISCORD_TOKEN` yang wajib; `GUILD_ID`/`CHANNEL_ID` tidak digunakan oleh versi terakhir.

3. Letakkan file MP3 ke folder `songs/`.

4. Pastikan bot sudah di-invite ke server dengan permission
   - Connect
   - Speak
   - Use Voice Activity
   dan `MESSAGE CONTENT INTENT` di-enable di Developer Portal.

---
## 🚀 Menjalankan Bot

```bash
node index.js
```

Setelah online, di Discord:
- Join voice channel
- Ketik `!join` untuk memulai pemutaran
- `!skip` untuk loncat lagu
- `!leave` untuk memberhentikan dan keluar voice

Bot akan otomatis memutar playlist berulang (loop).

---
## 📝 Struktur Proyek

```
iofi-bot/
├─ .env           # konfigurasi token
├─ index.js       # source utama
├─ package.json
├─ songs/         # simpan MP3 di sini
└─ README.md      # dokumentasi
```

---
## 🛠️ Fitur

- Playback MP3 lokal
- Loop otomatis 24/7
- Kontrol via chat
- Penanganan error sederhana

---
## 📦 Dependency Utama

- `discord.js`
- `@discordjs/voice`
- `ffmpeg-static` (via `createAudioResource`)

---
## 🔄 Pengembangan

- Tambahkan lebih banyak perintah
- Integrasi playlist online
- Fitur auto-disconnect pada channel kosong

---
## 📜 Lisensi

Project ini bebas digunakan dan dimodifikasi.

This project developed by [Bayu Kresna](https://github.com/Byblee38)