import { createCanvas } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create sprites directory if it doesn't exist
const spritesDir = path.join(__dirname, "../public/sprites");
if (!fs.existsSync(spritesDir)) {
  fs.mkdirSync(spritesDir, { recursive: true });
}

// Function to create a sprite
function createSprite(name, color) {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext("2d");

  // Fill background with transparency
  ctx.clearRect(0, 0, 32, 32);

  // Draw shape based on sprite type
  ctx.fillStyle = color;

  if (name === "player") {
    // Player is a triangle pointing right
    ctx.beginPath();
    ctx.moveTo(8, 8);
    ctx.lineTo(24, 16);
    ctx.lineTo(8, 24);
    ctx.closePath();
    ctx.fill();
  } else if (name === "enemy-basic") {
    // Basic enemy is a simple square
    ctx.fillRect(8, 8, 16, 16);
  } else if (name === "enemy-flanker") {
    // Flanker is a diamond
    ctx.beginPath();
    ctx.moveTo(16, 4);
    ctx.lineTo(28, 16);
    ctx.lineTo(16, 28);
    ctx.lineTo(4, 16);
    ctx.closePath();
    ctx.fill();
  } else if (name === "enemy-ranged") {
    // Ranged enemy is a circle
    ctx.beginPath();
    ctx.arc(16, 16, 10, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  // Save the sprite
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(path.join(spritesDir, `${name}.png`), buffer);
  console.log(`Created sprite: ${name}.png`);
}

// Create all sprites
createSprite("player", "#00ff00"); // Green player
createSprite("enemy-basic", "#ff0000"); // Red basic enemy
createSprite("enemy-flanker", "#ff00ff"); // Magenta flanker enemy
createSprite("enemy-ranged", "#ffff00"); // Yellow ranged enemy

console.log("All sprites generated successfully!");
