import { env } from "cloudflare:workers";

export const SESSION_MS = 5 * 60 * 60 * 1000;
const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2,"0")).join("");
const random = (n=32) => { const b=new Uint8Array(n); crypto.getRandomValues(b); return [...b].map(x=>x.toString(16).padStart(2,"0")).join(""); };
export async function hashPassword(password:string,salt:string){const key=await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveBits"]);return hex(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:enc.encode(salt),iterations:210000},key,256));}
export async function sha(value:string){return hex(await crypto.subtle.digest("SHA-256",enc.encode(value)));}
export function db(){return (env as unknown as {DB:D1Database}).DB;}
export async function issueSession(userId:string){const token=random();const now=Date.now();await db().prepare("INSERT INTO sessions(id,user_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),userId,await sha(token),now+SESSION_MS,now).run();return {token,expiresAt:now+SESSION_MS};}
export function cookie(token:string,maxAge=18000){return `pg_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;}
export function tokenFrom(req:Request){return req.headers.get("cookie")?.match(/(?:^|; )pg_session=([^;]+)/)?.[1]??null;}
export async function currentUser(req:Request){const token=tokenFrom(req);if(!token)return null;const row=await db().prepare("SELECT u.id,u.name,u.email,u.role,u.status,s.id session_id,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?").bind(await sha(token)).first<any>();if(!row||row.expires_at<Date.now()||row.status!=="active"){if(row?.session_id)await db().prepare("DELETE FROM sessions WHERE id=?").bind(row.session_id).run();return null;}return row;}
export {random};
