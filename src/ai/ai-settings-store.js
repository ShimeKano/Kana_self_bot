const fs=require('fs');const path=require('path');
const DATA_DIR=path.join(__dirname,'..','..','data');const AI_FILE=path.join(DATA_DIR,'ai.json');
const DEFAULTS={enabled:false,apiKey:'',provider:null,apiBase:null,model:null,models:[],ollamaModel:'qwen3:1.7b',updatedAt:null};
function ensureAiFile(){fs.mkdirSync(DATA_DIR,{recursive:true});if(!fs.existsSync(AI_FILE))fs.writeFileSync(AI_FILE,JSON.stringify(DEFAULTS,null,2)+'\n','utf8')}
function loadAiSettings(){ensureAiFile();try{const raw=JSON.parse(fs.readFileSync(AI_FILE,'utf8'));return {...DEFAULTS,...raw,models:Array.isArray(raw.models)?raw.models:[]}}catch{return {...DEFAULTS}}}
function saveAiSettings(changes={}){const next={...loadAiSettings(),...changes,updatedAt:new Date().toISOString()};fs.writeFileSync(AI_FILE,JSON.stringify(next,null,2)+'\n','utf8');return next}
function getEffectiveAiSettings(){const d=loadAiSettings();if(d.apiKey)return d;if(d.provider==='ollama')return {...d,provider:'ollama',apiBase:'http://127.0.0.1:11434',model:d.ollamaModel||'qwen3:1.7b'};return {...d,provider:null,apiBase:null,model:null}}
function getPublicAiSettings(){const d=loadAiSettings(),e=getEffectiveAiSettings();return {enabled:Boolean(d.enabled),provider:e.provider||null,apiConfigured:Boolean(d.apiKey),apiPreview:d.apiKey?'••••••••••••':'',apiBase:e.apiBase||null,model:e.model||null,models:d.models||[],ollamaModel:d.ollamaModel||'qwen3:1.7b',updatedAt:d.updatedAt||null}}
module.exports={AI_FILE,loadAiSettings,saveAiSettings,getEffectiveAiSettings,getPublicAiSettings};