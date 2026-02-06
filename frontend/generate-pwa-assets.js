#!/usr/bin/env node
/**
 * PWA Asset Generator for Fashion Finder
 * 
 * Generates all required icons and splash screens for iOS "Add to Home Screen"
 * 
 * Usage:
 *   npm install canvas
 *   node generate-pwa-assets.js
 * 
 * Or use the HTML generator: open frontend/public/generate-pwa-assets.html in browser
 */

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Brand colors
const ROSE = '#E11D48';
const CREAM = '#FDF8F5';

// Output directories
const ICONS_DIR = path.join(__dirname, 'public', 'icons');
const SPLASH_DIR = path.join(__dirname, 'public', 'splash');

// Icon sizes needed
const iconSizes = [
  { name: 'favicon-16x16', size: 16 },
  { name: 'favicon-32x32', size: 32 },
  { name: 'icon-72x72', size: 72 },
  { name: 'icon-96x96', size: 96 },
  { name: 'icon-128x128', size: 128 },
  { name: 'icon-144x144', size: 144 },
  { name: 'icon-152x152', size: 152 },
  { name: 'apple-touch-icon-152x152', size: 152 },
  { name: 'apple-touch-icon-167x167', size: 167 },
  { name: 'apple-touch-icon-180x180', size: 180 },
  { name: 'apple-touch-icon', size: 180 },
  { name: 'icon-192x192', size: 192 },
  { name: 'icon-384x384', size: 384 },
  { name: 'icon-512x512', size: 512 },
  { name: 'maskable-icon-512x512', size: 512, maskable: true },
  { name: 'shortcut-dress', size: 192, shortcut: 'dress' },
  { name: 'shortcut-heart', size: 192, shortcut: 'heart' }
];

// Splash screen sizes for different iPhones
const splashSizes = [
  { name: 'apple-splash-750x1334', width: 750, height: 1334 },
  { name: 'apple-splash-828x1792', width: 828, height: 1792 },
  { name: 'apple-splash-1125x2436', width: 1125, height: 2436 },
  { name: 'apple-splash-1170x2532', width: 1170, height: 2532 },
  { name: 'apple-splash-1179x2556', width: 1179, height: 2556 },
  { name: 'apple-splash-1242x2208', width: 1242, height: 2208 },
  { name: 'apple-splash-1242x2688', width: 1242, height: 2688 },
  { name: 'apple-splash-1284x2778', width: 1284, height: 2778 },
  { name: 'apple-splash-1290x2796', width: 1290, height: 2796 }
];

// Draw the fashion finder icon
function drawIcon(ctx, size, options = {}) {
  const { maskable = false, shortcut = null } = options;
  
  // Background
  const radius = maskable ? 0 : size * 0.2;
  ctx.fillStyle = ROSE;
  
  if (radius > 0) {
    // Rounded rectangle for regular icons
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, size, size);
  }
  
  // Draw simple dress shape (since we can't use emoji in node-canvas easily)
  const centerX = size / 2;
  const centerY = size / 2;
  
  ctx.fillStyle = 'white';
  
  if (shortcut === 'heart') {
    // Draw heart shape
    const heartSize = size * 0.4;
    drawHeart(ctx, centerX, centerY, heartSize);
  } else {
    // Draw dress shape
    const dressWidth = size * 0.4;
    const dressHeight = size * 0.5;
    drawDress(ctx, centerX, centerY, dressWidth, dressHeight);
  }
}

// Simple dress shape
function drawDress(ctx, x, y, width, height) {
  ctx.beginPath();
  // Top (shoulders)
  ctx.moveTo(x - width * 0.3, y - height * 0.4);
  ctx.lineTo(x + width * 0.3, y - height * 0.4);
  // Right shoulder to waist
  ctx.lineTo(x + width * 0.15, y - height * 0.1);
  // Waist to skirt right
  ctx.lineTo(x + width * 0.5, y + height * 0.5);
  // Skirt bottom
  ctx.lineTo(x - width * 0.5, y + height * 0.5);
  // Skirt left to waist
  ctx.lineTo(x - width * 0.15, y - height * 0.1);
  ctx.closePath();
  ctx.fill();
  
  // Neckline
  ctx.beginPath();
  ctx.arc(x, y - height * 0.35, width * 0.1, 0, Math.PI, true);
  ctx.fillStyle = ROSE;
  ctx.fill();
  ctx.fillStyle = 'white';
}

// Heart shape
function drawHeart(ctx, x, y, size) {
  ctx.beginPath();
  const topY = y - size * 0.3;
  ctx.moveTo(x, topY + size * 0.3);
  ctx.bezierCurveTo(x, topY, x - size * 0.5, topY, x - size * 0.5, topY + size * 0.3);
  ctx.bezierCurveTo(x - size * 0.5, topY + size * 0.6, x, topY + size * 0.9, x, topY + size);
  ctx.bezierCurveTo(x, topY + size * 0.9, x + size * 0.5, topY + size * 0.6, x + size * 0.5, topY + size * 0.3);
  ctx.bezierCurveTo(x + size * 0.5, topY, x, topY, x, topY + size * 0.3);
  ctx.fill();
}

// Draw splash screen
function drawSplash(ctx, width, height) {
  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, CREAM);
  gradient.addColorStop(1, '#FEE2E2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = Math.min(width, height) / 1000;
  
  // Draw dress icon
  ctx.fillStyle = ROSE;
  const iconSize = 150 * scale;
  drawDress(ctx, centerX, centerY - iconSize * 0.5, iconSize, iconSize * 1.2);
  
  // App name
  ctx.fillStyle = ROSE;
  ctx.font = `bold ${50 * scale}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Fashion Finder', centerX, centerY + iconSize * 0.8);
  
  // Tagline
  ctx.fillStyle = '#6B7280';
  ctx.font = `${24 * scale}px -apple-system, sans-serif`;
  ctx.fillText('Shop 28 stores at once', centerX, centerY + iconSize * 1.1);
}

// Main generation function
async function generate() {
  console.log('🎨 Generating PWA assets for Fashion Finder...\n');
  
  // Create directories
  fs.mkdirSync(ICONS_DIR, { recursive: true });
  fs.mkdirSync(SPLASH_DIR, { recursive: true });
  
  // Generate icons
  console.log('📱 Generating icons...');
  for (const icon of iconSizes) {
    const canvas = createCanvas(icon.size, icon.size);
    const ctx = canvas.getContext('2d');
    drawIcon(ctx, icon.size, icon);
    
    const buffer = canvas.toBuffer('image/png');
    const filepath = path.join(ICONS_DIR, `${icon.name}.png`);
    fs.writeFileSync(filepath, buffer);
    console.log(`   ✓ ${icon.name}.png (${icon.size}x${icon.size})`);
  }
  
  // Generate splash screens
  console.log('\n🖼️  Generating splash screens...');
  for (const splash of splashSizes) {
    const canvas = createCanvas(splash.width, splash.height);
    const ctx = canvas.getContext('2d');
    drawSplash(ctx, splash.width, splash.height);
    
    const buffer = canvas.toBuffer('image/png');
    const filepath = path.join(SPLASH_DIR, `${splash.name}.png`);
    fs.writeFileSync(filepath, buffer);
    console.log(`   ✓ ${splash.name}.png (${splash.width}x${splash.height})`);
  }
  
  console.log('\n✅ All assets generated successfully!');
  console.log(`\n📁 Icons saved to: ${ICONS_DIR}`);
  console.log(`📁 Splash screens saved to: ${SPLASH_DIR}`);
  console.log('\n🍎 To test on iPhone:');
  console.log('   1. Deploy your app or run with HTTPS');
  console.log('   2. Open in Safari on iPhone');
  console.log('   3. Tap Share → Add to Home Screen');
}

// Run if called directly
generate().catch(console.error);
