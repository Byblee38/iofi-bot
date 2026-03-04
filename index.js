require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const {
 joinVoiceChannel,
 createAudioPlayer,
 createAudioResource,
 AudioPlayerStatus,
 VoiceConnectionStatus,
 StreamType,
} = require("@discordjs/voice");
const fs = require("fs");
const path = require("path");

// Set FFmpeg path
const ffmpegPath = require("ffmpeg-static");
process.env.FFMPEG_PATH = ffmpegPath;
console.log(`🔧 FFmpeg path: ${ffmpegPath}`);

// Force sodium-native
try {
 require("sodium-native");
 console.log("✅ Using sodium-native for encryption");
} catch (e) {
 console.log("⚠️ sodium-native not available, using fallback");
}

const client = new Client({
 intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
 ],
});

const songsDir = path.join(__dirname, "songs");
let playlist = fs.readdirSync(songsDir).filter((f) => f.endsWith(".mp3"));
let currentIndex = 0;

const player = createAudioPlayer();
let currentConnection = null;
let isPlaying = false;

function playNext() {
 const songFile = playlist[currentIndex];
 const song = path.join(songsDir, songFile);

 if (!fs.existsSync(song)) {
  console.error(`❌ File tidak ditemukan: ${song}`);
  return;
 }

 console.log(`▶ Now playing: ${songFile}`);
 console.log(`📁 Path: ${song}`);
 console.log(`📦 File size: ${fs.statSync(song).size} bytes`);

 const resource = createAudioResource(song, {
  inputType: StreamType.Arbitrary,
  inlineVolume: true,
 });

 resource.volume?.setVolume(0.5);
 player.play(resource);

 currentIndex = (currentIndex + 1) % playlist.length;
}

player.on(AudioPlayerStatus.Playing, () => {
 console.log("🎵 Player status: PLAYING");
});

player.on(AudioPlayerStatus.Buffering, () => {
 console.log("⏳ Player status: BUFFERING");
});

player.on(AudioPlayerStatus.Idle, () => {
 console.log("⏹ Player status: IDLE — next song");
 if (isPlaying) {
  playNext();
 }
});

player.on("error", (err) => {
 console.error("❌ Player error:", err.message);
 if (isPlaying) {
  playNext();
 }
});

client.once("ready", () => {
 console.log(`✅ Bot online: ${client.user.tag}`);
 console.log("📝 Commands: !play, !stop, !skip, !pause, !resume, !test");
 console.log(`🎵 Found ${playlist.length} songs in playlist`);
});

client.on("messageCreate", async (message) => {
 if (message.author.bot) return;

 const content = message.content.toLowerCase().trim();

 // Command: !play
 if (content === "!play") {
  const voiceChannel = message.member?.voice?.channel;

  if (!voiceChannel) {
   return message.reply("❌ Kamu harus join voice channel dulu!");
  }

  try {
   // Jika sudah ada connection, destroy dulu
   if (currentConnection) {
    currentConnection.destroy();
    await new Promise((resolve) => setTimeout(resolve, 500));
   }

   const msg = await message.reply("🔊 Connecting to voice channel...");

   // Check permissions first
   const permissions = voiceChannel.permissionsFor(message.guild.members.me);
   if (!permissions.has("Connect") || !permissions.has("Speak")) {
    return msg.edit("❌ Bot tidak punya permission Connect/Speak di channel ini!");
   }

   const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: message.guild.id,
    adapterCreator: message.guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false,
   });

   currentConnection = connection;
   console.log(`🔌 Joining voice channel: ${voiceChannel.name}`);
   console.log(`🌐 Guild ID: ${message.guild.id}`);
   console.log(`📡 Channel ID: ${voiceChannel.id}`);

   // Use event-based approach instead of entersState
   connection.on(VoiceConnectionStatus.Ready, () => {
    console.log("✅ Voice connection READY");
    
    const subscription = connection.subscribe(player);
    if (subscription) {
     console.log("✅ Player subscribed");
     isPlaying = true;
     currentIndex = 0;
     playNext();
     msg.edit("🎵 Now playing music!");
    }
   });

   connection.on("stateChange", (oldState, newState) => {
    console.log(`🔄 Connection: ${oldState.status} → ${newState.status}`);
    
    // Log networking state if available
    if (newState.networking) {
     console.log(`📡 Networking state: ${newState.networking.state.code}`);
    }
   });

   // Debug networking
   connection.on("debug", (msg) => {
    console.log(`🐛 Debug: ${msg}`);
   });

   connection.on(VoiceConnectionStatus.Disconnected, async () => {
    console.log("⚠️ Disconnected, trying to reconnect...");
    try {
     await Promise.race([
      entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
      entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
     ]);
    } catch {
     console.log("❌ Could not reconnect, destroying connection");
     connection.destroy();
     currentConnection = null;
     isPlaying = false;
     message.channel.send("❌ Disconnected from voice channel");
    }
   });

   connection.on(VoiceConnectionStatus.Destroyed, () => {
    console.log("🔴 Connection destroyed");
    currentConnection = null;
    isPlaying = false;
   });

   connection.on("error", (err) => {
    console.error("❌ Voice connection error:", err);
    msg.edit("❌ Connection error!");
   });

   // Set timeout fallback
   setTimeout(() => {
    if (currentConnection && currentConnection.state.status !== VoiceConnectionStatus.Ready) {
     console.log("❌ Connection timeout - destroying");
     connection.destroy();
     msg.edit(
      "❌ Gagal connect (timeout). Coba:\n" +
       "1️⃣ Restart bot\n" +
       "2️⃣ Ganti region voice channel ke Singapore/Japan\n" +
       "3️⃣ Kick bot dari server & invite ulang"
     );
    }
   }, 15000);

  } catch (err) {
   console.error("❌ Failed to connect:", err);
   message.reply(
    "❌ Gagal connect ke voice channel. Pastikan:\n" +
     "1️⃣ Bot punya permission **Connect** dan **Speak**\n" +
     "2️⃣ Voice channel tidak full\n" +
     "3️⃣ Kamu sudah join voice channel"
   );
   if (currentConnection) {
    currentConnection.destroy();
    currentConnection = null;
   }
   isPlaying = false;
  }
 }

 // Command: !stop
 if (content === "!stop") {
  if (currentConnection) {
   isPlaying = false;
   player.stop();
   currentConnection.destroy();
   currentConnection = null;
   message.reply("⏹ Stopped and disconnected!");
  } else {
   message.reply("❌ Bot tidak sedang playing!");
  }
 }

 // Command: !skip
 if (content === "!skip") {
  if (isPlaying) {
   playNext();
   message.reply("⏭ Skipped to next song!");
  } else {
   message.reply("❌ Bot tidak sedang playing!");
  }
 }

 // Command: !pause
 if (content === "!pause") {
  if (isPlaying) {
   player.pause();
   message.reply("⏸ Paused!");
  } else {
   message.reply("❌ Bot tidak sedang playing!");
  }
 }

 // Command: !resume
 if (content === "!resume") {
  if (currentConnection) {
   player.unpause();
   message.reply("▶ Resumed!");
  } else {
   message.reply("❌ Bot tidak sedang playing!");
  }
 }

 // Command: !test - diagnostic
 if (content === "!test") {
  const voiceChannel = message.member?.voice?.channel;

  if (!voiceChannel) {
   return message.reply("❌ Kamu harus join voice channel dulu!");
  }

  const permissions = voiceChannel.permissionsFor(message.guild.members.me);
  const canConnect = permissions.has("Connect");
  const canSpeak = permissions.has("Speak");
  const canUseVAD = permissions.has("UseVAD");

  message.reply(
   `🔍 **Voice Channel Info:**\n` +
    `• Name: ${voiceChannel.name}\n` +
    `• ID: ${voiceChannel.id}\n` +
    `• Type: ${voiceChannel.type}\n` +
    `• Members: ${voiceChannel.members.size}\n` +
    `• Bitrate: ${voiceChannel.bitrate}\n` +
    `\n**Bot Permissions:**\n` +
    `• Connect: ${canConnect ? "✅" : "❌"}\n` +
    `• Speak: ${canSpeak ? "✅" : "❌"}\n` +
    `• Use Voice Activity: ${canUseVAD ? "✅" : "❌"}\n` +
    `\n${
     canConnect && canSpeak
      ? "✅ Bot can connect!"
      : "❌ Missing permissions!"
    }`
  );
 }
});

client.login(process.env.DISCORD_TOKEN);
