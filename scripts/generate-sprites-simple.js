// Simple script to generate sprite images
// Run with: node scripts/generate-sprites-simple.js

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

// Function to create a simple SVG sprite
function createSvgSprite(name, color, shape) {
  let svgContent = `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">`;

  // Add shape
  if (shape === "triangle") {
    // Player is a triangle pointing right
    svgContent += `<polygon points="8,8 24,16 8,24" fill="${color}" />`;
  } else if (shape === "square") {
    // Basic enemy is a square
    svgContent += `<rect x="8" y="8" width="16" height="16" fill="${color}" />`;
  } else if (shape === "diamond") {
    // Flanker is a diamond
    svgContent += `<polygon points="16,4 28,16 16,28 4,16" fill="${color}" />`;
  } else if (shape === "circle") {
    // Ranged enemy is a circle
    svgContent += `<circle cx="16" cy="16" r="10" fill="${color}" />`;
  } else if (shape === "pentagon") {
    // Bomber enemy is a pentagon
    svgContent += `<polygon points="16,6 26,14 22,26 10,26 6,14" fill="${color}" />`;
  }

  svgContent += `</svg>`;

  // Save the sprite as SVG
  const svgPath = path.join(spritesDir, `${name}.svg`);
  fs.writeFileSync(svgPath, svgContent);

  console.log(`Created sprite: ${name}.svg`);
}

// Create all sprites
createSvgSprite("player", "#00ff00", "triangle"); // Green player
createSvgSprite("enemy-basic", "#ff0000", "square"); // Red basic enemy
createSvgSprite("enemy-flanker", "#ff00ff", "diamond"); // Magenta flanker enemy
createSvgSprite("enemy-ranged", "#ffff00", "circle"); // Yellow ranged enemy
createSvgSprite("enemy-bomber", "#ff9900", "pentagon"); // Orange bomber enemy

// Remove invalid PNG files
try {
  fs.unlinkSync(path.join(spritesDir, "player.png"));
  fs.unlinkSync(path.join(spritesDir, "enemy-basic.png"));
  fs.unlinkSync(path.join(spritesDir, "enemy-flanker.png"));
  fs.unlinkSync(path.join(spritesDir, "enemy-ranged.png"));
  fs.unlinkSync(path.join(spritesDir, "enemy-bomber.png"));
  console.log("Removed invalid PNG files");
} catch (err) {
  console.log("Note: Some PNG files may not exist", err.message);
}

console.log("All sprites generated successfully!");
