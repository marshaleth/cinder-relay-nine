// Package the static browser game and its screenshots for the make.fun judge.
// Run locally with MAKEFUN_OUTPUT_DIR=out node main.ts to choose an output folder.
import { mkdirSync, cpSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const sourceDirectory = fileURLToPath(new URL('.', import.meta.url));
const destinationDirectory = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const screenshotSource = join(sourceDirectory, 'screenshots');
const screenshotDestination = join(destinationDirectory, 'screenshots');

// Create the destination before copying the game, and always provide a screenshots folder.
mkdirSync(destinationDirectory, { recursive: true });
cpSync(join(sourceDirectory, 'game'), join(destinationDirectory, 'game'), {
  recursive: true,
});
mkdirSync(screenshotDestination, { recursive: true });
if (existsSync(screenshotSource)) {
  cpSync(screenshotSource, screenshotDestination, { recursive: true });
}

// Match the judge's limits for dossier text, screenshots, game files and path lengths.
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};
const dossier = buildDossier(destinationDirectory, caps);
writeFileSync(join(destinationDirectory, 'dossier.json'), dossier);
