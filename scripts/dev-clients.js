const { spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const clients = [
  { name: 'user', cwd: path.join(root, 'Gharoo', 'Gharoo_client') },
  { name: 'admin', cwd: path.join(root, 'client') },
  { name: 'service', cwd: path.join(root, 'service-man-client') },
];

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const processes = [];

const shutdown = () => {
  processes.forEach((proc) => proc.kill());
  process.exit();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

clients.forEach(({ name, cwd }) => {
  const proc = spawn(npmCmd, ['run', 'dev:watch'], {
    cwd,
    stdio: 'inherit',
    shell: true,
  });

  processes.push(proc);

  proc.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      shutdown();
    }
  });

  console.log(`[${name}] watching for changes in ${cwd}`);
});
