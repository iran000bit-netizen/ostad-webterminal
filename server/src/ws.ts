import type { Server } from 'http';
import { WebSocketServer } from 'ws';
import { getSession } from './sessions.js';
export function attachWebSocket(server:Server){const wss=new WebSocketServer({server,path:'/ws'});wss.on('connection',(socket,req)=>{const token=new URL(req.url??'',`http://${req.headers.host}`).searchParams.get('token')??undefined;const a=getSession(token);if(!a){socket.close(1008,'Unauthorized');return}const send=(type:string,data:unknown)=>socket.readyState===socket.OPEN&&socket.send(JSON.stringify({type,data}));const off=a.onQuote(q=>send('quote',q));const timer=setInterval(async()=>{send('account',await a.account());send('positions',await a.positions())},1000);socket.on('close',()=>{off();clearInterval(timer)})});return wss}
