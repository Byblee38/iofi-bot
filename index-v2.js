require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { Player } = require("discord-player");
const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Create player instance
const player = new Player(client);

// Load playlist
const songsDir = path.join(__dirname, "songs");
const playlist = fs
  .readdirSync(songsDir)
  .filter((f) => f.endsWith(".mp3"))
  .map((f) => path.join(songsDir, f));

console.log(`🎵 Found ${playlist.length} songs`);

let currentSongIndex = 0;
let isLooping = true;
let activeQueue = null;

client.once("ready", () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
  console.log("📝 Commands: !play, !stop, !skip, !pause, !resume, !loop");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase().trim();

  // Command: !play
  if (content === "!play") {
    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) {
      return message.reply("❌ Join voice channel dulu!");
    }

    try {
      const msg = await message.reply("🔊 Starting music...");

      // Create queue
      const queue = player.nodes.create(message.guild, {
        metadata: {
          channel: message.channel,
          voiceChannel: voiceChannel,
        },
        leaveOnEnd: false,
        leaveOnStop: false,
        leaveOnEmpty: false,
        volume: 50,
      });

      // Connect to voice channel
      if (!queue.connection) {
        await queue.connect(voiceChannel);
      }

      activeQueue = queue;
      currentSongIndex = 0;

      // Play first song
      await queue.addTrack(playlist[currentSongIndex]);
      if (!queue.isPlaying()) {
        await queue.node.play();
      }

      msg.edit("🎵 Now playing!");
    } catch (err) {
      console.error("❌ Error:", err);
      message.reply(`❌ Error: ${err.message}`);
    }
  }

  // Command: !stop
  if (content === "!stop") {
    if (activeQueue) {
      activeQueue.delete();
      activeQueue = null;
      message.reply("⏹ Stopped!");
    } else {
      message.reply("❌ Not playing!");
    }
  }

  // Command: !skip
  if (content === "!skip") {
    if (activeQueue && activeQueue.isPlaying()) {
      activeQueue.node.skip();
      message.reply("⏭ Skipped!");
    } else {
      message.reply("❌ Not playing!");
    }
  }

  // Command: !pause
  if (content === "!pause") {
    if (activeQueue && activeQueue.isPlaying()) {
      activeQueue.node.pause();
      message.reply("⏸ Paused!");
    } else {
      message.reply("❌ Not playing!");
    }
  }

  // Command: !resume
  if (content === "!resume") {
    if (activeQueue && activeQueue.node.isPaused()) {
      activeQueue.node.resume();
      message.reply("▶ Resumed!");
    } else {
      message.reply("❌ Not paused!");
    }
  }

  // Command: !loop
  if (content === "!loop") {
    isLooping = !isLooping;
    message.reply(`🔁 Loop: ${isLooping ? "ON" : "OFF"}`);
  }
});

// Handle track end
player.events.on("playerStart", (queue, track) => {
  console.log(`▶ Now playing: ${path.basename(track.url)}`);
});

player.events.on("playerFinish", async (queue, track) => {
  console.log("⏹ Track finished");

  if (isLooping) {
    currentSongIndex = (currentSongIndex + 1) % playlist.length;
    await queue.addTrack(playlist[currentSongIndex]);
    await queue.node.play();
  }
});

player.events.on("error", (queue, error) => {
  console.error("❌ Player error:", error);
});

player.events.on("playerError", (queue, error) => {
  console.error("❌ Track error:", error);
});

client.login(process.env.DISCORD_TOKEN);
