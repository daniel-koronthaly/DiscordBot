# Discord Bot

This is a just-for-fun Discord bot code created by Daniel Koronthály.

Can be used to create a leaderboard of who has the most unique messages containing a word/substring (case insensitive) in a channel by sending in that channel

    !fcount ${arg}

Note that this does not use caching and is very intentionally inefficient: processing 100,000 messages takes ~20 minutes every time it is run. 

Also generates a random color in an embed message by sending in a channel

    !color


Usage:

Create .env file containing the Discord bot token in the format

    TOKEN='insertvalidtokenhere'


Node.js has to be installed, then

    npm install discord.js

If you are not on Windows, you may have to change

    "program": "${workspaceFolder}\\bot.js"

to 

    "program": "${workspaceFolder}/bot.js"

in launch.json

    
