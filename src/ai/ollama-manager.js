const { spawn } = require('child_process');
const DEFAULT_MODEL='qwen3:1.7b';
const BASE='http://127.0.0.1:11434';
let serverProcess=null;
function exists(cmd){return new Promise(resolve=>{const p=spawn(process.platform==='win32'?'where':'which',[cmd],{windowsHide:true});p.on('close',c=>resolve(c===0));p.on('error',()=>resolve(false));});}
function run(cmd,args,onLine=()=>{}){return new Promise((resolve,reject)=>{const p=spawn(cmd,args,{stdio:['ignore','pipe','pipe'],windowsHide:true});let out='';const f=x=>{const s=String(x);out+=s;s.split(/\r?\n/).filter(Boolean).forEach(onLine)};p.stdout.on('data',f);p.stderr.on('data',f);p.on('error',reject);p.on('close',c=>c===0?resolve(out):reject(new Error(out.trim()||cmd+' failed')));});}
async function isRunning(){try{return(await fetch(BASE+'/api/tags')).ok}catch{return false}}
async function startServer(onLine=()=>{}){
 if(!(await exists('ollama')))throw new Error('Ollama chưa được cài');
 if(await isRunning())return{running:true,startedByApp:false};
 if(serverProcess&&!serverProcess.killed)return{running:false,startedByApp:true};
 onLine('Starting Ollama server...');
 serverProcess=spawn('ollama',['serve'],{stdio:['ignore','pipe','pipe'],windowsHide:true,detached:true});
 const f=x=>String(x).split(/\r?\n/).filter(Boolean).forEach(onLine);
 serverProcess.stdout.on('data',f);serverProcess.stderr.on('data',f);serverProcess.on('exit',()=>{serverProcess=null});serverProcess.unref();
 const deadline=Date.now()+15000;
 while(Date.now()<deadline){if(await isRunning())return{running:true,startedByApp:true};await new Promise(r=>setTimeout(r,500))}
 throw new Error('Ollama server chưa sẵn sàng sau 15 giây');
}
async function stopServer(){if(!serverProcess||serverProcess.killed)return{running:await isRunning(),stopped:false};try{serverProcess.kill()}catch{}serverProcess=null;return{running:await isRunning(),stopped:true}}
async function status(){
 const installed=await exists('ollama');if(!installed)return{installed:false,running:false,models:[],version:null,startedByApp:false};
 let version=null,models=[];try{version=(await run('ollama',['--version'])).trim()}catch{}try{models=(await run('ollama',['list'])).split(/\r?\n/).slice(1).map(x=>x.trim().split(/\s+/)[0]).filter(Boolean)}catch{}
 return{installed:true,running:await isRunning(),models,version,startedByApp:Boolean(serverProcess&&!serverProcess.killed)};
}
async function install(onLine=()=>{}){
 if(await exists('ollama')){await startServer(onLine);return{ok:true,...await status()}}
 if(process.platform==='win32')await run('winget',['install','--id','Ollama.Ollama','--exact','--accept-package-agreements','--accept-source-agreements'],onLine);
 else if(process.platform==='linux')await run('sh',['-c','curl -fsSL https://ollama.com/install.sh | sh'],onLine);
 else throw new Error('Tự động cài Ollama hiện chỉ hỗ trợ Windows/Linux.');
 await startServer(onLine);return{ok:true,...await status()};
}
async function pullModel(model=DEFAULT_MODEL,onLine=()=>{}){
 if(!(await exists('ollama')))throw new Error('Ollama chưa được cài');
 await startServer(onLine);const name=String(model).trim();if(!name)throw new Error('Tên model không được để trống');
 await run('ollama',['pull',name],onLine);return{ok:true,model:name,...await status()};
}
async function removeModel(model,onLine=()=>{}){
 if(!(await exists('ollama')))throw new Error('Ollama chưa được cài');const name=String(model).trim();if(!name)throw new Error('Tên model không được để trống');
 await run('ollama',['rm',name],onLine);return{ok:true,...await status()};
}
module.exports={DEFAULT_MODEL,status,install,startServer,stopServer,pullModel,removeModel};