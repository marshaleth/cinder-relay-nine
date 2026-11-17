// Relay Nine: two yards joined by a dogleg service lane and an exposed central arcade.
export const sites = [{x:-12,z:-11,name:'A · CONDENSER'}, {x:12,z:-11,name:'B · SWITCHYARD'}];
export const blocks = [];
function box(x,z,w,d,h,kind='wall') { blocks.push({x,z,w,d,h,kind,minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2}); }
box(-22,0,1,45,6); box(22,0,1,45,6); box(0,-22,45,1,6); box(0,22,45,1,6);
box(-7,6,6,13,4.8,'building'); box(7,6,6,13,4.8,'building');
box(-7,-10,5,8,4.8,'building'); box(7,-10,5,8,4.8,'building');
box(0,-2,3,2,1.2,'crate'); box(0,-16,4,2,2.8,'wall');
box(-16,3,4,2,1.25,'crate'); box(16,0,4,2,1.25,'crate');
box(-14,-7,3,2,1.25,'crate'); box(14,-15,3,2,1.25,'crate');
box(-2,15,3,2,1.25,'crate'); box(12,15,3,2,1.25,'crate');
export function blocked(x,z,r=.36) {
  for (let i=0;i<blocks.length;i++) { const b=blocks[i]; if(x>b.minX-r&&x<b.maxX+r&&z>b.minZ-r&&z<b.maxZ+r) return true; }
  return false;
}
export function move(a,dx,dz) {
  if(!blocked(a.x+dx,a.z)) a.x+=dx;
  if(!blocked(a.x,a.z+dz)) a.z+=dz;
}
// Slab intersection without temporary vectors. Used by bullets, vision, sound and blast cover.
export function rayBox(ox,oy,oz,dx,dy,dz,x0,y0,z0,x1,y1,z1) {
  let lo=0,hi=1000,t0,t1;
  if(Math.abs(dx)<1e-8) { if(ox<x0||ox>x1)return Infinity; }
  else {t0=(x0-ox)/dx;t1=(x1-ox)/dx;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));}
  if(Math.abs(dy)<1e-8) { if(oy<y0||oy>y1)return Infinity; }
  else {t0=(y0-oy)/dy;t1=(y1-oy)/dy;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));}
  if(Math.abs(dz)<1e-8) { if(oz<z0||oz>z1)return Infinity; }
  else {t0=(z0-oz)/dz;t1=(z1-oz)/dz;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));}
  return hi>=lo?lo:Infinity;
}
export function wallDistance(x,y,z,dx,dy,dz) {
  let near=100;
  for(let i=0;i<blocks.length;i++){const b=blocks[i];near=Math.min(near,rayBox(x,y,z,dx,dy,dz,b.minX,0,b.minZ,b.maxX,b.h,b.maxZ));}
  if(dy<0)near=Math.min(near,-y/dy);
  return near;
}
export function visible(x,z,tx,tz,y=1.5) {
  const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);
  return d<.01||wallDistance(x,y,z,dx/d,0,dz/d)>d-.3;
}
// A reusable 1m navigation grid. BFS runs only when a bot picks a new destination.
const N=43,S=N*N,queue=new Int16Array(S),parent=new Int16Array(S),free=new Uint8Array(S);
for(let i=0;i<S;i++)free[i]=!blocked(i%N-21,Math.floor(i/N)-21,.48);
function cell(x,z){return Math.max(0,Math.min(N-1,Math.round(x)+21))+N*Math.max(0,Math.min(N-1,Math.round(z)+21));}
export function route(bot,x,z) {
  let start=cell(bot.x,bot.z),end=cell(x,z);
  if(!free[end]) { let best=Infinity;for(let i=0;i<S;i++)if(free[i]){const d=(i%N-21-x)**2+(Math.floor(i/N)-21-z)**2;if(d<best){best=d;end=i;}} }
  parent.fill(-1);let read=0,write=1;queue[0]=start;parent[start]=start;
  while(read<write&&parent[end]<0){const c=queue[read++];for(let k=0;k<4;k++){const n=c+(k===0?1:k===1?-1:k===2?N:-N);if(n<0||n>=S||!free[n]||parent[n]>=0||((k<2)&&Math.floor(n/N)!==Math.floor(c/N)))continue;parent[n]=c;queue[write++]=n;}}
  bot.pathLen=0;bot.pathAt=0;
  if(parent[end]<0)return;
  let c=end;while(c!==start&&bot.pathLen<bot.path.length){bot.path[bot.pathLen++]=c;c=parent[c];}
  for(let i=0,j=bot.pathLen-1;i<j;i++,j--){const t=bot.path[i];bot.path[i]=bot.path[j];bot.path[j]=t;}
}
export function follow(bot,dt,speed) {
  if(bot.pathAt>=bot.pathLen)return false;
  const c=bot.path[bot.pathAt],x=c%N-21,z=Math.floor(c/N)-21,dx=x-bot.x,dz=z-bot.z,d=Math.hypot(dx,dz);
  if(d<.15){bot.pathAt++;return true;}
  const v=Math.min(speed*dt,d);move(bot,dx/d*v,dz/d*v);bot.yaw=Math.atan2(-dx,-dz);return true;
}
