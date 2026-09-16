import { create } from 'zustand';
import type { Account, Order, Position, Quote } from './api';
type State={token:string;account?:Account;quotes:Quote[];positions:Position[];orders:Order[];symbol:string;tf:string;logs:string[];set:(x:Partial<State>)=>void;log:(x:string)=>void};
export const useTerminal=create<State>((set)=>({token:localStorage.getItem('ostad-token')||'',quotes:[],positions:[],orders:[],symbol:'BTCUSDT',tf:'H1',logs:['Ostad WebTerminal started'],set:(x)=>set(x),log:(x)=>set(s=>({logs:[...s.logs,`${new Date().toLocaleTimeString()}  ${x}`].slice(-100)}))}));
