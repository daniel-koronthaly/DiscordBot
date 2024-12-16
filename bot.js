const Discord = require('discord.js')
const voiceDiscord = require('@discordjs/voice')
const { clientId, guildId } = require('./config.json');
const snakeGame = require('./snake.js');
const { messageLink, EmbedBuilder } = require('discord.js')
const https = require('https');
require('dotenv').config()
const { spawn } = require('child_process');
const fs = require('fs')

const path = require('path')

function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

const dmStates = new Map();

const commands = [
  new Discord.SlashCommandBuilder()
    .setName('dm')
    .setDescription('Send a direct message with a button to a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to DM')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to send')
        .setRequired(true)
    ),
].map(command => command.toJSON());

// Register the commands with Discord's API
const rest = new Discord.REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Discord.Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

function pad(numberString, size) {
  let padded = numberString;
  while (padded.length < size) {
    padded = '0' + padded;
  }
  return padded;
}

const choices = [
  'daniel',
  'nick',
  'pedro',
  'roshan',
  'ryan',
  'tyler'
]

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

function arraysAreEqual(array1, array2) {
  return JSON.stringify(array1) === JSON.stringify(array2);
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
    console.log(msg.author)
    msg.channel.send("Hi <@" + msg.author + ">")
  }
  else if (msg.content === "Say hi to Joe") {
    msg.channel.send("Hi <@" + "197997250566291457" + ">")
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
  else if (msg.content.startsWith("!degrade")) {
    const args = msg.content.split(" ")

    if (args.length !== 2) {
      msg.channel.send("Give me a person to insult as well.")
      return;
    }
    const endpoint = 'https://insult.mattbas.org/api/insult'

    const params = {
      who: args[1],
    };
    const url = new URL(endpoint);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    fetch(url)
      .then(response => response.text()) // Parse the JSON from the response
      .then(data => msg.channel.send(data)) // Handle the data
      .catch(error => console.error('Error:', error)); // Handle errors
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
  else if (msg.content === '!button') {
    // Create buttons
    const button1 = new Discord.ButtonBuilder()
      .setCustomId('button1')
      .setLabel('Button 1')
      .setStyle(Discord.ButtonStyle.Primary);

    const button2 = new Discord.ButtonBuilder()
      .setCustomId('button2')
      .setLabel('Button 2')
      .setStyle(Discord.ButtonStyle.Secondary);

    // Add buttons to an action row
    const row = new Discord.ActionRowBuilder().addComponents(button1, button2);

    // Send a message with buttons
    await msg.channel.send({
      content: 'Here are your buttons!',
      components: [row],
    });
  }
  else if (msg.content === '!snake') {
    try {
      // Call the startGame function from snake.js
      await snakeGame.startGame(msg);
    } catch (error) {
      console.error("Error starting the snake game:", error);
      msg.channel.send("Something went wrong while starting the game!");
    }
  }
  else if (choices.includes(msg.content)) {
    const imageName = 'avatar' + msg.content + '.png'
    const image = fs.readFileSync(path.join(__dirname, imageName))
    const attachment = new Discord.AttachmentBuilder(image, { name: 'avatar.png' })

    msg.channel.send({ files: [attachment] })
  }
  else if (msg.content.startsWith("give phone")) {
    if (msg.content.split(" ").length != 3) {
      msg.channel.send("give area code")
    }
    else {
      areaCode = msg.content.split(" ")[2]
      if (isNaN(parseInt(areaCode))) {
        msg.channel.send("give better area code (NaN)")
      }
      else if (areaCode.length != 3) {
        msg.channel.send("give better area code (length not 3)")
      }
      else {
        msg.channel.send("(" + areaCode + ") " + generateRandomString(3) + "-" + generateRandomString(4))
      }
    }

  }
  // else if (msg.author.id == "473355726983528451") {
  //   splitString = msg.content.split(" ")
  //   if (splitString.length > 4 && splitString.length < 9) {
  //     splitString = shuffle(splitString).join(" ")
  //     msg.channel.send(splitString)
  //   }
  // }
  else if (!msg.author.bot) {
    splitString = msg.content.toLowerCase().split(" ")
    if (splitString.length > 3) {
      sorted = [...splitString].sort()
      if (arraysAreEqual(sorted, splitString)) {
        msg.channel.send("Wow! Your message was in order alphabetically!")
      }
    }

    // var CloudmersiveNlpApiClient = require('cloudmersive-nlp-api-client');
    // var defaultClient = CloudmersiveNlpApiClient.ApiClient.instance;
    // // Configure API key authorization: Apikey
    // var Apikey = defaultClient.authentications['Apikey'];
    // Apikey.apiKey = 'f50f4072-25b6-4720-ba50-88f74b32535e';
    // // Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
    // //Apikey.apiKeyPrefix = 'Token';
    // var apiInstance = new CloudmersiveNlpApiClient.WordsApi();
    // var input = msg.content
    // var callback = function (error, data, response) {
    //   if (error) {
    //     console.error(error);
    //   } else {
    //     console.log('API called successfully. Returned data: ' + data);
    //     data = data.replace(/['"]+/g, '')
    //     if (data !== "") {
    //       firstNoun = data.split(",")[0].split("/")[0]
    //       console.log(firstNoun);
    //       console.log(msg.author.username)
    //       msg.channel.send("Excellent " + firstNoun + ", " + msg.author.username + ". So proud of you for crushing another " + firstNoun + ". Keep up the hard work and remember that the sky's the limit!")
    //     }
    //   }
    // };
    // apiInstance.wordsNouns(input, callback);
  }
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'button1') {
    await interaction.reply('You clicked Button 1!');
  } else if (interaction.customId === 'button2') {
    await interaction.reply('You clicked Button 2!');
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'dm') {

    // Get the target user and message content
    const user = options.getUser('user');
    const messageContent = options.getString('message');

    try {
      // Send a message to the user with the "Reveal Message" button
      const dmChannel = await user.createDM();

      const button = new Discord.ButtonBuilder()
        .setCustomId('reveal_message')
        .setLabel('Reveal Message')
        .setStyle(Discord.ButtonStyle.Primary);

      const message = await dmChannel.send({
        content: 'You have a secret message! Click to reveal it.\nIf you reveal it, the author will be notified that you have revealed the message.',
        components: [
          new Discord.ActionRowBuilder().addComponents(button),
        ],
      });

      // Store the DM message for later editing
      dmStates.set(message.id, { originalMessage: messageContent, author: interaction.user.id, recipient: user.id });

      await interaction.reply({
        content: `Your message to <@${user.id}> has been sent! They will receive a secret message shortly.`,
        ephemeral: true, // Only the invoker sees this
      });

    } catch (error) {
      console.error('Error sending DM:', error);
      await interaction.followUp({ content: 'An error occurred while sending the DM.', ephemeral: true });
    }
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const { customId, user } = interaction;
  if (customId === 'reveal_message') {

    if (Date.now() > dmStates.get(interaction.message.id)?.timeout) {
      // If the timeout has expired, edit the message to say it's expired
      await interaction.update({
        content: 'Sorry, the message has expired and cannot be revealed. Click on it within 15 minutes of the user sending it to you next time!',
        components: [], // Remove the button
      });
      return;
    }

    const message = interaction.message;

    // Check if this message exists in our DM state map
    const dmState = dmStates.get(message.id);
    if (!dmState) return;

    // Make sure the user clicking the button is the intended recipient
    if (user.id !== dmState.recipient) {
      await interaction.reply({ content: 'This is not your message!', ephemeral: true });
      return;
    }

    const author = await client.users.fetch(dmState.author);

    // Reveal the message content to the recipient
    await message.edit({
      content: `${dmState.originalMessage}`,
      components: [],
    });

    // Notify the original author that the message has been revealed
    if (author) {
      await author.send(`Your message "${dmState.originalMessage}" to ${user.tag} has been revealed.`);
    }

    // Clean up the DM state for this message
    dmStates.delete(message.id);
  }
});


function generateRandomString(length) {
  let result = '';
  const digits = '0123456789';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    result += digits.charAt(randomIndex);
  }

  return result;
}

//console.log(process.env.TOKEN)
client.login(process.env.TOKEN)

