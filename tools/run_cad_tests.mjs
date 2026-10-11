// Prefer project-local CAD Python environment, whether activated or not.
// CI can still use its provisioned python3 when .venv does not exist.
import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const localPython=process.platform==='win32'
  ? join(root,'.venv','Scripts','python.exe')
  : join(root,'.venv','bin','python');
const python=existsSync(localPython) ? localPython
  : (process.platform==='win32' ? 'python' : 'python3');
const args=['-m','unittest','discover','-s','tests','-p','python_*.py','-v'];
const result=spawnSync(python,args,{cwd:root,stdio:'inherit'});
if(result.error){console.error('CAD test runner:',result.error.message);process.exit(1);}
process.exit(result.status??1);
