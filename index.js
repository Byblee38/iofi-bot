require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} = require("@discordjs/voice");
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

const player = createAudioPlayer();
const songsDir = path.join(__dirname, "songs");
const songs = fs.readdirSync(songsDir).filter((f) => f.endsWith(".mp3"));

let currentSong = 0;
let connection = null;

function playSong() {
  const songPath = path.join(songsDir, songs[currentSong]);
  console.log(`🎵 Playing: ${songs[currentSong]}`);

  const resource = createAudioResource(songPath);
  player.play(resource);

  currentSong = (currentSong + 1) % songs.length;
}

player.on(AudioPlayerStatus.Idle, () => {
  console.log("⏭ Song ended, playing next...");
  playSong();
});

player.on("error", (err) => {
  console.error("❌ Player error:", err);
  playSong();
});

client.once("ready", () => {
  console.log(`✅ ${client.user.tag} is ready!`);
  console.log("Type !join in Discord to start playing");
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  if (msg.content === "!join") {
    const vc = msg.member?.voice?.channel;
    if (!vc) return msg.reply("❌ Join a voice channel first!");

    try {
      connection = joinVoiceChannel({
        channelId: vc.id,
        guildId: msg.guild.id,
        adapterCreator: msg.guild.voiceAdapterCreator,
      });

      console.log("🔌 Connecting...");

      // Wait for ready status via event
      connection.on(VoiceConnectionStatus.Ready, () => {
        console.log("✅ Connected!");
        connection.subscribe(player);
        currentSong = 0;
        playSong();
        msg.reply("🎵 Playing music!");
      });

      connection.on("error", (err) => {
        console.error("❌ Connection error:", err);
        msg.channel.send("❌ Failed to connect");
      });
    } catch (err) {
      console.error("❌ Error:", err);
      msg.reply("❌ Error: " + err.message);
    }
  }

  if (msg.content === "!leave") {
    if (connection) {
      connection.destroy();
      connection = null;
      player.stop();
      msg.reply("👋 Bye!");
    }
  }

  if (msg.content === "!skip") {
    if (connection) {
      playSong();
      msg.reply("⏭ Skipped!");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
