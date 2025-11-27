/**
 * Dev script - spustí Next.js na porte 3000
 * Ak je port obsadený, najprv ho uvoľní
 */

const { spawn, execSync } = require('child_process');
const os = require('os');

const PORT = 3000;

function killProcessOnPort(port) {
  const isWindows = os.platform() === 'win32';

  try {
    if (isWindows) {
      // Windows: nájdi PID a ukonči proces
      const result = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf8' });
      const lines = result.trim().split('\n');

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];

        if (pid && pid !== '0') {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(`Port ${port}: ukončený proces PID ${pid}`);
          } catch {
            // Proces už neexistuje
          }
        }
      }
    } else {
      // Linux/Mac: použijeme lsof a kill
      const result = execSync(`lsof -ti :${port}`, { encoding: 'utf8' });
      const pids = result.trim().split('\n').filter(Boolean);

      for (const pid of pids) {
        try {
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
          console.log(`Port ${port}: ukončený proces PID ${pid}`);
        } catch {
          // Proces už neexistuje
        }
      }
    }
  } catch {
    // Port nie je obsadený alebo chyba - pokračujeme
  }
}

// Uvoľni port
console.log(`Kontrolujem port ${PORT}...`);
killProcessOnPort(PORT);

// Počkaj chvíľu aby sa port uvoľnil
setTimeout(() => {
  console.log(`Spúšťam Next.js na porte ${PORT}...`);

  // Spusti Next.js
  const next = spawn('npx', ['next', 'dev', '-p', PORT.toString()], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  next.on('error', (err) => {
    console.error('Chyba pri spúšťaní Next.js:', err);
    process.exit(1);
  });

  next.on('close', (code) => {
    process.exit(code || 0);
  });
}, 500);
