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
  new Discord.SlashCommandBuilder()
    .setName('vote')
    .setDescription('Start a vote to keep or delete a message.')
    .addStringOption(option =>
      option.setName('message_id')
        .setDescription('The ID of the message to vote on.')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('vote_threshold')
        .setDescription('The number of delete votes needed to delete the message.')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('time_limit')
        .setDescription('Time limit for voting in seconds.')
        .setRequired(true)),
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

function disconnectBot(guildId) {
  // Get the voice connection for the guild
  const connection = voiceDiscord.getVoiceConnection(guildId);

  if (connection) {
    // Destroy the connection to disconnect the bot
    connection.destroy();
    console.log(`Disconnected from the voice channel in guild: ${guildId}`);
  } else {
    console.log(`No active voice connection found in guild: ${guildId}`);
  }
}

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

function playSong(filePath) {
  const resource = voiceDiscord.createAudioResource(filePath, {
    inputType: voiceDiscord.StreamType.Arbitrary,
    inlineVolume: true,
  })
  resource.volume.setVolume(2)
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
})

client.on('messageCreate', async (msg) => {
  if (msg.content === '!hamster') {
    var voiceChannel = msg.member.voice.channel
    if (!voiceChannel) {
      msg.channel.send("You must be in a channel to play this.")
      return
    }
    else {
      await playSong('./hampster.mp4');
      const connection = await connectToChannel(voiceChannel)
      connection.subscribe(player)
      await msg.reply('Playing now!');
    }

  }
  else if (msg.content === '!disconnect') {
    disconnectBot(msg.guild.id);
  }
  else if (msg.content.startsWith('!delete')) {
    // Split the message to get the message ID
    const args = msg.content.split(' ');
    const messageId = args[1]; // The message ID should be the second part of the command

    if (!messageId) {
      return msg.reply('Please provide a message ID to delete.');
    }

    try {
      // Fetch the channel the command was sent in
      const channel = msg.channel;

      // Fetch the message with the given ID
      const targetMessage = await channel.messages.fetch(messageId);

      // Check if the message was sent by the bot
      if (targetMessage.author.id !== client.user.id) {
        return msg.reply('I can only delete my own messages.');
      }

      // Delete the target message
      await targetMessage.delete();
      console.log('Message deleted successfully.');
    } catch (error) {
      console.error('Error deleting message:', error);
      console.log('Could not delete the message. Make sure the ID is correct and the message exists.');
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
      .setEmoji('775309381817991168')
      .setStyle(Discord.ButtonStyle.Secondary);

    const button2 = new Discord.ButtonBuilder()
      .setCustomId('button2')
      .setEmoji('831126515252985886')
      .setStyle(Discord.ButtonStyle.Secondary);

    // Add buttons to an action row
    const row = new Discord.ActionRowBuilder().addComponents(button1, button2);

    // Send a message with buttons
    await msg.channel.send({
      content: '',
      components: [row],
    });
  }
  else if (msg.content === '!pedro') {
    // Create buttons
    const button1 = new Discord.ButtonBuilder()
      .setCustomId('pedro')
      .setEmoji('775309381817991168')
      .setStyle(Discord.ButtonStyle.Secondary);


    // Add buttons to an action row
    const row = new Discord.ActionRowBuilder().addComponents(button1);

    await msg.channel.send({
      content: '',
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
  else if (msg.content.startsWith("test")) {
    console.log(msg.author)
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
  }

})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'button1') {
    await interaction.reply('Pedro will kill you.');
  } else if (interaction.customId === 'button2') {
    await interaction.reply('Nick will kill you also.');
  }
  else if (interaction.customId === 'pedro') {
    // Send a message with buttons
    var voiceChannel = interaction.member.voice.channel
    if (!voiceChannel) {
      console.log("Not in a channel")
      return
    }
    else {
      await playSong('./jumpscare.mp3');
      const connection = await connectToChannel(voiceChannel)
      connection.subscribe(player)
    }
    await interaction.update({
      content: 'https://tenor.com/view/five-nights-at-candy\'sf-fnac-fnac-3-fnaf-five-nights-at-freddy\'s-gif-12705573290353218296',
      components: [], // Remove the button
    });
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

votes = {}

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand() && interaction.commandName === 'vote') {
    const messageId = interaction.options.getString('message_id');
    const voteThreshold = interaction.options.getInteger('vote_threshold');
    const timeLimit = interaction.options.getInteger('time_limit');

    if (!messageId || voteThreshold <= 0 || timeLimit <= 0) {
      return interaction.reply('Please provide a valid message ID, vote threshold, and time limit.');
    }

    try {
      const targetMessage = await interaction.channel.messages.fetch(messageId);
      const author = targetMessage.author;

      const button = new Discord.ButtonBuilder()
        .setCustomId('delete' + messageId)
        .setLabel('Delete')
        .setStyle(Discord.ButtonStyle.Danger);

      const embed = new Discord.EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Vote to Delete Message By ${author.username}`)
        .setDescription(targetMessage.content)
        .addFields(
          [
            { name: 'Votes Needed', value: voteThreshold.toString(), inline: true },
            { name: 'Current Vote Count', value: '0', inline: true }
          ]
        )
        .setThumbnail(author.displayAvatarURL({ dynamic: true, size: 64 })) // Set the author's avatar as thumbnail


      const row = new Discord.ActionRowBuilder().addComponents(button);

      let timeLeft = timeLimit;
      let timeStart = Date.now();
      let timerMessage = await interaction.reply({
        content: `Voting started! Time remaining: <t:${Math.floor(timeStart / 1000 + timeLeft)}:R>`,
        embeds: [embed],
        components: [row],
      });

      votes[messageId] = { threshold: voteThreshold, voters: new Set(), msg: timerMessage, timeLimit: timeLimit, embed: embed }

      // Countdown timer
      const interval = setInterval(async () => {
        timeLeft--;

        if (timeLeft <= 0) {
          delete votes[messageId]
          clearInterval(interval);
          try {
            await timerMessage.edit({ content: "Ran out of time and threshold was not reached.", embeds: [] })

            setTimeout(async () => {
              try {
                await timerMessage.delete();
              } catch {
                console.log('Message already deleted');
              }
            }, 3000);
          }
          catch {
            console.log('already deleted')
          }

        }
      }, 1000);
    }
    catch (error) {
      console.log(error)
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  // Ensure it's a button interaction
  if (interaction.isButton() && interaction.customId.startsWith('delete')) {
    messageId = interaction.customId.replace('delete', '')
    votes[messageId].voters.add(interaction.user.id)
    const voteThreshold = votes[messageId].threshold;
    const currentVotes = votes[messageId].voters.size;

    const updatedEmbed = votes[messageId].embed
      .setFields(
        [
          { name: 'Votes Needed', value: voteThreshold.toString(), inline: true },
          { name: 'Current Vote Count', value: currentVotes.toString(), inline: true }
        ]
      );

    // Edit the timer message with the updated embed and vote count
    await votes[messageId].msg.edit({
      content: `Voting started! Time remaining: <t:${Math.floor(Date.now() / 1000 + (votes[messageId].timeLimit || 0))}:R>`,
      embeds: [updatedEmbed],
    });
    await interaction.deferUpdate();
    if (votes[messageId].voters.size >= votes[messageId].threshold) {
      try {
        const targetMessage = await interaction.channel.messages.fetch(messageId);
        await votes[messageId].msg.delete()
        await targetMessage.delete();
        delete votes[messageId]
      }
      catch {
        console.log('Unable to delete ' + messageId)
      }
    }
  }
})

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

