const { spawn } = require('child_process');

const nodePath = process.execPath;
const npmExecPath = process.env.npm_execpath;
const fallbackNpm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function startProcess(script, name) {
  const child = npmExecPath
    ? spawn(nodePath, [npmExecPath, 'run', script], { stdio: 'inherit' })
    : spawn(fallbackNpm, ['run', script], { stdio: 'inherit' });

  child.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`[dev-with-poll] ${name} exited with code ${code}`);
    }
    process.exit(code ?? 0);
  });

  return child;
}

const nextDev = startProcess('dev:next', 'next dev');
const poller = startProcess('telegram:poll', 'telegram:poll');

function shutdown() {
  if (nextDev) nextDev.kill('SIGINT');
  if (poller) poller.kill('SIGINT');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
