// Simple script to create placeholder icon PNGs
// Run with: node create-icons.js

const fs = require('fs');

// Create a simple colored PNG (minimal valid PNG)
function createSimplePNG(size, filename) {
  // This creates a very basic PNG - in production, use proper icons
  // For now, we'll create placeholder files that work
  
  const { createCanvas } = require('canvas');
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#FFE4E6');
  gradient.addColorStop(0.5, '#FB7185');
  gradient.addColorStop(1, '#F43F5E');
  
  // Rounded rect
  const radius = size * 0.18;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Dress emoji (text)
  ctx.font = `${size * 0.5}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('👗', size / 2, size / 2);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created ${filename}`);
}

// Note: This requires 'canvas' package: npm install canvas
// If canvas is not available, icons need to be created manually
console.log('To generate icons, install canvas: npm install canvas');
console.log('Then run this script, or use generate-icons.html in a browser');
