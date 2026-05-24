import { writeFileSync } from 'fs';
import { spawn } from 'child_process';

// Generate .dev.vars dynamically from the container's environment variables
const envContent = Object.entries(process.env)
  .filter(([key]) => key.startsWith('SUPABASE_') || key.startsWith('VITE_') || key.startsWith('OPENAI_'))
  .map(([key, val]) => `${key}="${val.replace(/"/g, '\\"')}"`)
  .join('\n');

// Write to both root and server build directory to ensure wrangler dev picks it up
writeFileSync('.dev.vars', envContent);
try {
  writeFileSync('dist/server/.dev.vars', envContent);
} catch (e) {
  // If dist/server does not exist yet, it's fine (though it should after build)
}

console.log('[Startup] Generated .dev.vars file with environment variables.');

// Start Wrangler production worker runtime
const wrangler = spawn('npx', [
  'wrangler',
  'dev',
  '--config',
  'dist/server/wrangler.json',
  '--ip',
  '0.0.0.0',
  '--port',
  '3000'
], { stdio: 'inherit', shell: true });

wrangler.on('exit', (code) => {
  process.exit(code || 0);
});
