const axios = require('axios');
const config = require('../config');
const { getActiveTarget, disableAccount, setAccountTokenStatus } = require('./config-store');

function createApi(token) { return axios.create({ baseURL: config.discord.apiBase, headers: { Authorization: token, 'Content-Type': 'application/json', 'User-Agent': config.discord.userAgent }, timeout: 15000 }); }
function resolveTarget(target) { const resolved = target || getActiveTarget(); if (!resolved?.token || !resolved?.channelId) throw new Error('Chưa có account/token/channel đang hoạt động'); return resolved; }
function handleError(error, action, target = null) {
  const status = error.response?.status; const responseData = error.response?.data; let errorCode='UNKNOWN_ERROR'; let errorMessage=error.message;
  if(status===401){errorCode='UNAUTHORIZED';errorMessage='Token không hợp lệ hoặc hết hạn';if(target?.accountId)disableAccount(target.accountId,errorMessage);}
  else if(status===403){errorCode='FORBIDDEN';errorMessage='Không có quyền thực hiện thao tác này';}
  else if(status===404){errorCode='NOT_FOUND';errorMessage='Channel hoặc resource không tồn tại';}
  else if(status===429){errorCode='RATE_LIMITED';errorMessage='Bị giới hạn tốc độ - thử lại sau '+(responseData?.retry_after||5)+'s';}
  else if(error.code==='ECONNABORTED'){errorCode='TIMEOUT';errorMessage='Yêu cầu vượt quá thời gian chờ';}
  console.error('[Discord API] '+action+': '+(status||'NETWORK')+' - '+errorMessage); return {ok:false,error:errorCode,status,message:errorMessage,details:responseData};
}
async function sendMessage(content,target){try{const r=resolveTarget(target);const response=await createApi(r.token).post('/channels/'+r.channelId+'/messages',{content,tts:false,flags:0});return{ok:true,data:response.data,messageId:response.data?.id||null,accountId:r.accountId,channelId:r.channelId};}catch(error){return handleError(error,'gửi message',target);}}
async function fetchMessages(limit=10,target){try{const r=resolveTarget(target);const n=Math.min(Math.max(Number(limit)||10,1),100);const response=await createApi(r.token).get('/channels/'+r.channelId+'/messages?limit='+n);return{ok:true,data:response.data};}catch(error){return handleError(error,'lấy tin nhắn',target);}}
async function fetchLatestMessages(limit=10,target){return fetchMessages(limit,target);}
async function fetchCurrentUser(target){try{const r=resolveTarget(target);const response=await createApi(r.token).get('/users/@me');return{ok:true,data:response.data};}catch(error){return handleError(error,'lấy thông tin account',target);}}
async function verifyToken(target){try{const r=resolveTarget(target);const response=await createApi(r.token).get('/users/@me');setAccountTokenStatus(r.accountId,'valid',null);return{ok:true,data:response.data};}catch(error){return handleError(error,'kiểm tra token',target);}}
async function clickButton(messageId,componentId){if(!messageId)return{ok:false,error:'MESSAGE_ID_REQUIRED',message:'Thiếu messageId'};if(!componentId)return{ok:false,error:'COMPONENT_ID_REQUIRED',message:'Thiếu componentId'};return{ok:false,error:'COMPONENT_ACTION_NOT_IMPLEMENTED',message:'Component interaction adapter chưa được triển khai'};}
module.exports={sendMessage,fetchMessages,fetchLatestMessages,fetchCurrentUser,verifyToken,clickButton};