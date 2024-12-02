let snakeGameActive = false;
let gameOver = false;
let snake = [];
let direction = { x: 1, y: 0 };
let food = { x: 10, y: 10 };
const gridSize = 10;

module.exports = {
    name: 'snake',
    description: 'Play Snake in Discord!',
    startGame: async (message) => {
        if (snakeGameActive) {
            return message.reply("A game is already active! Please wait.");
        }

        snakeGameActive = true;
        gameOver = false;
        snake = [{ x: 5, y: 5 }];
        direction = { x: 1, y: 0 };
        food = generateFood();  // Ensure food doesn't spawn on the snake

        const stopButton = {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 4, // Red button
                    label: 'Stop Game',
                    customId: 'stop_game',
                },
            ],
        };

        const directionButtons = {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 1, // Blue button
                    label: 'Up',
                    customId: 'up',
                },
                {
                    type: 2,
                    style: 1, // Blue button
                    label: 'Left',
                    customId: 'left',
                },
                {
                    type: 2,
                    style: 1, // Blue button
                    label: 'Down',
                    customId: 'down',
                },
                {
                    type: 2,
                    style: 1, // Blue button
                    label: 'Right',
                    customId: 'right',
                },
            ],
        };

        const initialMessage = await message.channel.send({
            content: getGrid(),
            components: [directionButtons, stopButton],
        });

        const filter = (interaction) => interaction.isButton() && interaction.message.id === initialMessage.id;
        const collector = initialMessage.createMessageComponentCollector({ filter, time: 600000 });

        collector.on('collect', async (buttonInteraction) => {
            if (gameOver) {
                return buttonInteraction.update({
                    content: 'Game over! Press !snake to start a new game.',
                    components: [],
                });
            }

            // Handle the Stop Game button interaction
            if (buttonInteraction.customId === 'stop_game') {
                snakeGameActive = false; // Stop the game logic
                gameOver = true; // Mark game as over
                await buttonInteraction.update({
                    content: 'Game stopped. The game has been terminated.',
                    components: [],
                });
                // Optionally, delete the message after stopping the game
                setTimeout(() => {
                    initialMessage.delete(); // Delete the message after a delay
                }, 2000);
            } else {
                // Handle the direction buttons
                switch (buttonInteraction.customId) {
                    case 'up': direction = { x: 0, y: -1 }; break;
                    case 'down': direction = { x: 0, y: 1 }; break;
                    case 'left': direction = { x: -1, y: 0 }; break;
                    case 'right': direction = { x: 1, y: 0 }; break;
                }
                moveSnake();
                await buttonInteraction.update({
                    content: getGrid(),
                    components: [directionButtons, stopButton],
                });

                if (gameOver) {
                    await buttonInteraction.followUp({ content: 'Game over! Press !snake to start a new game.' });
                }
            }
        });

        collector.on('end', () => {
            if (!gameOver) {
                initialMessage.edit({
                    content: 'Game ended due to inactivity.',
                    components: [],
                });
            }
            snakeGameActive = false;
        });
    }
};

function getGrid() {
    let grid = '';
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const snakePart = snake.find(part => part.x === x && part.y === y);
            if (snakePart) {
                if (snake[0].x === x && snake[0].y === y) {
                    grid += '🤓';  // Head of the snake (green)
                } else {
                    grid += '🟩';  // Body part (also green for simplicity)
                }
            } else if (food.x === x && food.y === y) {
                grid += '🍎';  // Food
            } else {
                grid += '⬛';  // Empty space
            }
        }
        grid += '\n';
    }
    return grid;
}

// Move the snake
function moveSnake() {
    const head = { ...snake[0] }; // Make a copy of the head
    head.x += direction.x;
    head.y += direction.y;

    // Check if the snake has eaten food
    if (head.x === food.x && head.y === food.y) {
        snake.unshift(head); // Add new head to the snake
        food = generateFood(); // Generate new food
    } else {
        snake.unshift(head); // Add new head
        snake.pop(); // Remove the last part of the snake (if not eating food)
    }

    // Now check for collisions with walls or the snake itself (after moving)
    if (checkCollision(head)) {
        gameOver = true; // Set gameOver flag if collision occurs
    }
}

// Check if the snake collides with walls or itself
function checkCollision(head) {
    // Check if the snake's head is out of bounds
    if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
        return true; // Collided with the wall
    }

    // Check if the snake's head collides with its body (but not with itself)
    if (isSnakePosition(head.x, head.y, true)) {
        return true; // Collided with itself
    }

    return false; // No collision
}

// Generate a random position for the food
function generateFood() {
    let foodPosition;
    do {
        foodPosition = {
            x: Math.floor(Math.random() * gridSize),
            y: Math.floor(Math.random() * gridSize),
        };
    } while (isSnakePosition(foodPosition.x, foodPosition.y)); // Ensure food doesn't spawn on the snake
    return foodPosition;
}

// Helper function to check if the snake occupies the current position (excluding the head)
function isSnakePosition(x, y, excludeHead = false) {
    // If excludeHead is true, we don't check the head itself
    return snake.slice(excludeHead ? 1 : 0).some(segment => segment.x === x && segment.y === y);
}