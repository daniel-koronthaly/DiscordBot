const Discord = require('discord.js')
const voiceDiscord = require('@discordjs/voice')
const { messageLink, EmbedBuilder } = require('discord.js')
const https = require('https');
require('dotenv').config()

function pad(numberString, size) {
  let padded = numberString;
  while (padded.length < size) {
    padded = '0' + padded;
  }
  return padded;
}

const client = new Discord.Client({
  intents: ["Guilds", "GuildMessages", 'MessageContent', "GuildVoiceStates"]
})

const player = voiceDiscord.createAudioPlayer()

const prefix = "!"

function playSong() {
  const resource = voiceDiscord.createAudioResource("./hampster.mp4", {
    inputType: voiceDiscord.StreamType.Arbitrary
  })
  player.play(resource)

  return voiceDiscord.entersState(player, voiceDiscord.AudioPlayerStatus.Playing, 5000)
}

async function connectToChannel(channel) {
  const connection = voiceDiscord.joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator
  });

  try {
    await voiceDiscord.entersState(connection, voiceDiscord.VoiceConnectionStatus.Ready, 30_000);
    return connection;
  } catch (error) {
    connection.destroy();
    throw error;
  }
}

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`)
  try {
    await playSong();
    console.log('Song is ready to play!');
  } catch (error) {

    console.error(error);
  }
})

client.on('messageCreate', async (msg) => {
  if (msg.content === '!hamster') {
    var voiceChannel = msg.member.voice.channel
    if (!voiceChannel) {
      msg.channel.send("You must be in a channel to play this.")
      return
    }
    else {
      const connection = await connectToChannel(voiceChannel)
      connection.subscribe(player)
      await msg.reply('Playing now!');
    }

  }
  else if (msg.content === "Say hi") {
    msg.channel.send("Hi <@" + msg.author + ">")
  }
  // else if(msg.content.includes("https://twitter.com") || msg.content.includes("https://x.com")){
  //   let newMsg = msg.content;
  //   newMsg = newMsg.replaceAll("https://twitter.com", "https://vxtwitter.com");
  //   newMsg = newMsg.replaceAll("https://x.com", "https://vxtwitter.com");
  //   newMsg += "\n" + "Sent by <@" + msg.author + ">";
  //   msg.channel.send(newMsg);
  //   msg.delete();
  // }
  else if (msg.content.startsWith("!fcount")) {
    const start = performance.now();
    const args = msg.content.split(" ");
    if (args.length !== 2) {
      msg.channel.send("Usage: \"!fcount $(arg)\". Make sure to specify the word to search for.")
      return;
    }
    const stringToCheck = args[1].toLowerCase();
    console.log("starting processing for " + stringToCheck)

    messages = await msg.channel.messages.fetch({ limit: 1 })
    let messagesFind = []

    while (messages) {
      addThese = await msg.channel.messages.fetch({ limit: 100, before: messages.id });
      addThese.filter((msgss) => msgss.content.toLowerCase().includes(stringToCheck)).forEach(msg => messagesFind.push(msg))
      messages = 0 < addThese.size ? addThese.at(addThese.size - 1) : null;
    }
    let values = Object.values(messagesFind.reduce((values, msg) => {
      values[msg.author] = values[msg.author] || { name: msg.author, count: 0 };
      values[msg.author].count++;
      return values;
    }, {}));

    let sorted = values.sort((a, b) => b.count - a.count)
    let newMsg = "How many times people said \"" + stringToCheck + "\"\n\n";
    for (var i = 0; i < sorted.length; i++) {
      newMsg += sorted[i].name.username + " | " + sorted[i].count + "\n";
      //console.log(sorted[i].name.username + " | " + sorted[i].count)
    }

    if (newMsg !== "") {
      newMsg += "\n"
      const ms = (performance.now() - start)
      const seconds = Math.floor((ms / 1000) % 60);
      const minutes = Math.floor((ms / 1000 / 60) % 60);
      const hours = Math.floor((ms / 1000 / 3600) % 24)
      const timeFormatted = [
        pad(hours.toString(), 2),
        pad(minutes.toString(), 2),
        pad(seconds.toString(), 2),
      ].join(':');
      newMsg += (stringToCheck + " took " + timeFormatted + " to process")
      msg.channel.send(newMsg)
    }
  }
  else if (msg.content.startsWith("!affirmation")) {
    https.get('https://www.affirmations.dev/', (res) => {
      if (res.statusCode !== 200) {
        console.error(`Did not get an OK from the server. Code: ${res.statusCode}`);
        res.resume();
        return;
      }

      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('close', () => {
        console.log('Retrieved all data');
        data = JSON.parse(data);
        msg.channel.send(data["affirmation"])
      });
    });
  }
  else if (msg.content.startsWith("!color")) {
    https.get('https://api.popcat.xyz/randomcolor', (res) => {
      if (res.statusCode !== 200) {
        console.error(`Did not get an OK from the server. Code: ${res.statusCode}`);
        res.resume();
        return;
      }

      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('close', () => {
        data = JSON.parse(data);
        const embed = new Discord.EmbedBuilder().setImage(data["image"]).setTitle(data["name"]).setDescription("#" + data["hex"]).setColor(data["hex"])
        msg.channel.send({ embeds: [embed] });
      });
    });
  }
})

//console.log(process.env.TOKEN)
client.login(process.env.TOKEN)

