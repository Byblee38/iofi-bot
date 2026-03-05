# Iofi Radio Discord Bot

A simple Discord bot that plays MP3 files located in the `songs` folder inside a voice channel. Designed for 24/7 music streaming and controlled via chat commands.

---
## 🔧 Setup

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root containing:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   GUILD_ID=<optional>
   CHANNEL_ID=<optional>
   ```
   > **NOTE:** Only `DISCORD_TOKEN` is required; `GUILD_ID`/`CHANNEL_ID` are unused in the latest version.

3. Put your MP3 files inside the `songs/` folder.

4. Make sure the bot is invited to the server with the following permissions:
   - Connect
   - Speak
   - Use Voice Activity
   Also enable **MESSAGE CONTENT INTENT** in the Developer Portal.

---
## 🚀 Running the Bot

```bash
node index.js
```

Once the bot is online, in Discord:
- Join a voice channel
- Type `!join` to start playback
- `!skip` to skip to the next track
- `!leave` to stop and disconnect

The bot will automatically loop through the playlist.

---
## 📝 Project Structure

```
iofi-bot/
├─ .env           # token configuration
├─ index.js       # main source file
├─ package.json
├─ songs/         # store MP3 files here
└─ README.md      # documentation
```

---
### 🛠️ Features

- Local MP3 playback
- Automatic 24/7 looping
- Chat-based controls
- Simple error handling

---
## 📦 Main Dependencies

- `discord.js`
- `@discordjs/voice`
- `ffmpeg-static` (via `createAudioResource`)

---
## 🔄 Development

- Add more commands
- Online playlist integration
- Auto-disconnect feature when channel is empty

---
## 📜 License

This project is free to use and modify.

This project developed by [Bayu Kresna](https://github.com/Byblee38)