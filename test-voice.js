// Simple voice connection test
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`✅ Bot ready: ${client.user.tag}`);
  console.log("Type !join in Discord to test voice connection");
});

client.on("messageCreate", (message) => {
  if (message.content === "!join" && !message.author.bot) {
    const channel = message.member?.voice?.channel;
    if (!channel) {
      return message.reply("Join a voice channel first!");
    }

    console.log("\n=== CONNECTION TEST START ===");
    console.log(`Joining: ${channel.name} (${channel.id})`);

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });

    let stateHistory = [];

    connection.on("stateChange", (old, newer) => {
      const timestamp = new Date().toISOString().split("T")[1];
      const log = `[${timestamp}] ${old.status} → ${newer.status}`;
      console.log(log);
      stateHistory.push(log);

      if (newer.status === "ready") {
        console.log("✅ SUCCESS! Connection is READY");
        console.log("\nState history:");
        stateHistory.forEach((s) => console.log(`  ${s}`));
        message.reply("✅ Voice connection successful!");
      }
    });

    connection.on("error", (err) => {
      console.error("❌ Error:", err);
    });

    // Timeout check
    setTimeout(() => {
      if (connection.state.status !== "ready") {
        console.log("\n❌ TIMEOUT - Connection never reached ready state");
        console.log("Final state:", connection.state.status);
        console.log("\nState history:");
        stateHistory.forEach((s) => console.log(`  ${s}`));
        message.reply("❌ Connection timeout");
        connection.destroy();
      }
    }, 20000);
  }

  if (message.content === "!leave" && !message.author.bot) {
    const { getVoiceConnection } = require("@discordjs/voice");
    const connection = getVoiceConnection(message.guild.id);
    if (connection) {
      connection.destroy();
      message.reply("👋 Left voice channel");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
