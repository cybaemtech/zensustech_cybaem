import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';
const children = [];

function launch(label, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: repoRoot,
    env: process.env,
    stdio: 'inherit',
    shell: isWindows,
    ...options,
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(`[${label}] failed to start: ${error.message}`);
    shutdown(1);
  });
  child.on('exit', (code) => {
    if (!stopping && code !== 0) {
      console.error(`[${label}] exited with code ${code ?? 'unknown'}`);
      shutdown(code ?? 1);
    }
  });
}

let stopping = false;
function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill();
  }
  process.exitCode = code;
}

process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());

console.log('Starting frontend and FastAPI backend.');
console.log('Swagger UI: http://127.0.0.1:8010/api/v1/docs');
launch('api', 'python', [
  '-m', 'uvicorn', 'app.main:app', '--app-dir', 'backend',
  '--host', '127.0.0.1', '--port', '8010', '--reload',
]);
launch('frontend', isWindows ? 'pnpm.cmd' : 'pnpm', [
  '--filter', '@workspace/zensus-tech-login', 'run', 'dev',
]);
