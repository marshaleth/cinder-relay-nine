import {sites,move,blocked,visible,wallDistance,rayBox,route,follow} from './map.js';
export const guns=[
 {name:'KITE / 9',price:0,mag:16,reserve:64,damage:28,gap:.23,reload:1.35,spread:.003,kick:.012},
 {name:'VESPER / 24',price:1800,mag:24,reserve:96,damage:36,gap:.115,reload:1.9,spread:.0018,kick:.022},
 {name:'MICA / 36',price:1200,mag:36,reserve:108,damage:23,gap:.075,reload:1.65,spread:.005,kick:.014}
];
function actor(team,index){return {x:0,z:0,eye:1.6,yaw:0,pitch:0,hp:100,team,index,alive:true,vx:0,vz:0,crouch:false,gun:0,mag:16,reserve:64,reload:0,cool:0,recoil:0,flash:0,armor:0,grenades:1,path:new Int16Array(900),pathAt:0,pathLen:0,think:0,reaction:0,hold:0,plant:0,defuse:0};}
export function createSimulation(audio) {
 const p=actor(0,0),actors=[p];for(let i=1;i<6;i++)actors.push(actor(i<3?0:1,i));
 const s={p,actors,time:0,round:0,score:[0,0],money:3000,phase:'intro',phaseTime:0,timer:100,attack:0,buy:false,started:false,match:false,message:'',notice:'',noticeTime:0,hit:0,hurt:0,head:false,kills:0,plantProgress:0,defuseProgress:0,bomb:{active:false,x:0,z:0,timer:38,defuse:0},noise:{x:0,z:0,time:-10,team:0},tracers:[],grenades:[],explosion:0,blastX:0,blastZ:0};
 for(let i=0;i<40;i++)s.tracers.push({x:0,y:0,z:0,tx:0,ty:0,tz:0,life:0,team:0});
 for(let i=0;i<8;i++)s.grenades.push({x:0,y:0,z:0,vx:0,vy:0,vz:0,life:0,team:0});
 let traceIndex=0,stepClock=0;
 function note(text){s.notice=text;s.noticeTime=3;}
 function equip(a,id){a.gun=id;a.mag=guns[id].mag;a.reserve=guns[id].reserve;a.reload=a.cool=0;}
 function round(){
  s.round++;s.attack=(s.round-1)%2;s.phase='buy';s.phaseTime=12;s.timer=100;s.buy=false;s.bomb.active=false;s.bomb.defuse=0;s.plantProgress=s.defuseProgress=0;s.message='';s.match=false;
  for(const a of actors){const survived=a.alive,id=a===p&&survived?a.gun:a===p?0:1;a.hp=100;a.alive=true;a.team=a.index<3?0:1;a.x=(a.index%3-1)*3;a.z=a.team===s.attack?18:-18;a.eye=1.6;a.yaw=a.z>0?0:Math.PI;a.pitch=0;a.vx=a.vz=0;a.armor=a===p&&survived?a.armor:a===p?0:25;a.grenades=1;a.pathLen=0;a.pathAt=0;a.think=.2+a.index*.17;a.reaction=0;a.hold=0;a.plant=a.defuse=0;a.flash=a.recoil=0;equip(a,id);}
  for(const g of s.grenades)g.life=0;
  note(s.attack===0?'ATTACK · Carry the charge to A or B':'DEFEND · Hold the relays. Defuse any planted charge.');
 }
 function start(){if(!s.started||s.match){s.started=true;s.round=0;s.score[0]=s.score[1]=0;s.money=3000;s.kills=0;p.alive=false;round();}}
 function finish(winner,reason){if(s.phase==='end')return;s.phase='end';s.phaseTime=6;s.buy=false;s.score[winner]++;s.money=Math.min(12000,s.money+(winner===0?2600:1900));s.message=(winner===0?'ROUND SECURED':'ROUND LOST')+' · '+reason;s.match=s.score[winner]>=5;audio.play(winner===0?'kill':'beep');}
 function buy(id){if(s.phase!=='buy'||!p.alive)return;if(id<3){if(s.money<guns[id].price){note('Insufficient credits');return;}s.money-=guns[id].price;equip(p,id);note(guns[id].name+' issued');}else if(id===3&&s.money>=600&&p.armor<75){s.money-=600;p.armor=75;note('Ceramic vest equipped');}else if(id===4&&s.money>=300&&p.grenades<2){s.money-=300;p.grenades++;note('FRAG added');}}
 function trace(x,y,z,dx,dy,dz,d,team){const t=s.tracers[traceIndex++%40];t.x=x;t.y=y;t.z=z;t.tx=x+dx*d;t.ty=y+dy*d;t.tz=z+dz*d;t.life=.075;t.team=team;}
 function hurt(a,damage,head,by){if(!a.alive)return;if(!head&&a.armor>0){const absorb=Math.min(a.armor,damage*.35);a.armor-=absorb;damage-=absorb;}a.hp=Math.max(0,a.hp-damage);if(a===p){s.hurt=.45;audio.play('hit');}if(a.hp<=0){a.alive=false;if(by===p&&a.team!==p.team){s.money=Math.min(12000,s.money+300);s.kills++;note((head?'HEADSHOT · ':'')+'Sentinel neutralized +300');audio.play('kill');}if(a!==p&&a.team===0)note('Ally down');}}
 function shoot(a,dx,dy,dz,spread){const gun=guns[a.gun];if(a.cool>0||a.reload>0||a.mag<=0)return false;a.mag--;a.cool=gun.gap;a.flash=.06;a.recoil=Math.min(.1,a.recoil+gun.kick*.4);
  dx+=(Math.random()-.5)*spread*2;dy+=(Math.random()-.5)*spread*2;dz+=(Math.random()-.5)*spread*2;const inv=1/Math.hypot(dx,dy,dz);dx*=inv;dy*=inv;dz*=inv;
  const y=a.eye;let dist=wallDistance(a.x,y,a.z,dx,dy,dz),victim=null,head=false;
  for(const b of actors){if(!b.alive||b.team===a.team)continue;const h=rayBox(a.x,y,a.z,dx,dy,dz,b.x-.19,b.eye-.18,b.z-.19,b.x+.19,b.eye+.22,b.z+.19);const body=rayBox(a.x,y,a.z,dx,dy,dz,b.x-.30,.25,b.z-.24,b.x+.30,b.eye-.18,b.z+.24);if(h<dist&&h<=body){dist=h;victim=b;head=true;}else if(body<dist){dist=body;victim=b;head=false;}}
  trace(a.x,y,a.z,dx,dy,dz,dist,a.team);if(victim){hurt(victim,gun.damage*(head?3.5:1),head,a);if(a===p){s.hit=.15;s.head=head;audio.play('hit');}}
  s.noise.x=a.x;s.noise.z=a.z;s.noise.time=s.time;s.noise.team=a.team;audio.play(a===p?'shot':'enemy',(a.x-p.x)/18);return true;
 }
 function reload(a){if(a.reload<=0&&a.mag<guns[a.gun].mag&&a.reserve>0){a.reload=guns[a.gun].reload;if(a===p)audio.play('beep');}}
 function throwGrenade(){if(!p.alive||s.phase!=='live'||p.grenades<=0)return;for(const g of s.grenades)if(g.life<=0){p.grenades--;g.life=1.65;g.x=p.x;g.y=p.eye;g.z=p.z;g.vx=-Math.sin(p.yaw)*12;g.vz=-Math.cos(p.yaw)*12;g.vy=4+Math.sin(p.pitch)*7;g.team=p.team;note('FRAG out');break;}}
 function bots(dt){for(let i=1;i<actors.length;i++){
  const a=actors[i];if(!a.alive)continue;a.think-=dt;a.hold-=dt;
  let enemy=null,nearest=32;
  for(const b of actors){if(!b.alive||a.team===b.team)continue;const d=Math.hypot(b.x-a.x,b.z-a.z);if(d<nearest&&visible(a.x,a.z,b.x,b.z,Math.min(a.eye,b.eye))){nearest=d;enemy=b;}}
  if(enemy){a.reaction+=dt;a.yaw=Math.atan2(a.x-enemy.x,a.z-enemy.z);if(a.reaction>.48+i*.035){const dx=enemy.x-a.x,dz=enemy.z-a.z,dy=enemy.eye-.3-a.eye,d=Math.hypot(dx,dy,dz);shoot(a,dx/d,dy/d,dz/d,.038+nearest*.0013);}
    if(nearest>13&&a.think<=0){route(a,enemy.x,enemy.z);a.think=.8;}if(nearest>13)follow(a,dt,2);else if(a.cool>.1)move(a,Math.cos(s.time*2+i)*dt*.65,0);
  }else{
   a.reaction=0;
   if(a.think<=0){a.think=1.4+Math.random();
    if(s.bomb.active){route(a,s.bomb.x+(a.team===s.attack?(i%2?4:-4):0),s.bomb.z+(a.team===s.attack?3:0));}
    else if(s.time-s.noise.time<3&&s.noise.team!==a.team&&Math.hypot(s.noise.x-a.x,s.noise.z-a.z)<22){route(a,s.noise.x,s.noise.z);a.hold=0;}
    else if(a.team===s.attack){const site=sites[(s.round+i)%2];route(a,site.x,site.z);}
    else if(a.pathAt>=a.pathLen&&a.hold<=0){const site=sites[i%2];route(a,site.x+(i%2?3:-3),site.z+5);a.hold=6+Math.random()*5;}
   }
   follow(a,dt,a.team===s.attack?2.7:2.3);
  }
  if(a.mag===0)reload(a);
  if(!s.bomb.active&&a.team===s.attack){let atSite=false;for(const site of sites)if(Math.hypot(a.x-site.x,a.z-site.z)<2.5&&!enemy){atSite=true;a.plant+=dt;if(a.plant>=3.2)plant(a.x,a.z);}if(!atSite)a.plant=0;}
  if(s.bomb.active&&a.team!==s.attack&&Math.hypot(a.x-s.bomb.x,a.z-s.bomb.z)<1.8&&!enemy){a.defuse+=dt;s.bomb.defuse=a.defuse;if(a.defuse>=5)finish(a.team,'Charge disarmed');}else a.defuse=0;
 }}
 function plant(x,z){if(s.bomb.active)return;s.bomb.active=true;s.bomb.x=x;s.bomb.z=z;s.bomb.timer=38;s.money+=s.attack===0?300:0;note('CHARGE ARMED · 38 seconds');audio.play('beep');}
 function step(dt,input){
  s.time+=dt;s.noticeTime=Math.max(0,s.noticeTime-dt);s.hit=Math.max(0,s.hit-dt);s.hurt=Math.max(0,s.hurt-dt);s.explosion=Math.max(0,s.explosion-dt);
  for(const t of s.tracers)t.life=Math.max(0,t.life-dt);
  if(!s.started)return;
  const keys=input.keys,pressed=input.pressed;
  if(pressed.has('KeyB')&&s.phase==='buy')s.buy=!s.buy;
  if(s.buy){for(let i=0;i<5;i++)if(pressed.has('Digit'+(i+1)))buy(i);}
  if(pressed.has('KeyR'))reload(p);if(pressed.has('KeyG'))throwGrenade();
  if(pressed.has('Enter')&&s.phase==='end'){if(s.match)start();else round();pressed.clear();return;}
  if(s.phase==='end'){s.phaseTime-=dt;if(s.phaseTime<=0&&!s.match)round();pressed.clear();return;}
  for(const a of actors){a.cool=Math.max(0,a.cool-dt);a.flash=Math.max(0,a.flash-dt);a.recoil=Math.max(0,a.recoil-dt*.04);if(a.reload>0){a.reload=Math.max(0,a.reload-dt);if(a.reload===0){const n=Math.min(guns[a.gun].mag-a.mag,a.reserve);a.mag+=n;a.reserve-=n;}}}
  if(s.phase==='buy'){s.phaseTime-=dt;if(s.phaseTime<=0||pressed.has('Enter')){s.phase='live';s.buy=false;note('RELAYS LIVE · Move with your team');}pressed.clear();return;}
  if(p.alive&&!s.buy){p.crouch=keys.has('KeyC')||keys.has('ControlLeft');p.eye+=( (p.crouch?1.0:1.6)-p.eye)*Math.min(1,dt*14);const f=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0),r=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),n=Math.hypot(f,r)||1,v=p.crouch?2.2:keys.has('ShiftLeft')?2.8:5;
   const wx=(-Math.sin(p.yaw)*f+Math.cos(p.yaw)*r)/n*v,wz=(-Math.cos(p.yaw)*f-Math.sin(p.yaw)*r)/n*v,blend=Math.min(1,dt*12);p.vx+=(wx-p.vx)*blend;p.vz+=(wz-p.vz)*blend;move(p,p.vx*dt,p.vz*dt);
   const speed=Math.hypot(p.vx,p.vz);stepClock+=dt*speed;if(stepClock>2.2&&speed>3){stepClock=0;audio.play('step');s.noise.x=p.x;s.noise.z=p.z;s.noise.team=0;s.noise.time=s.time;}
   if(input.fire){const cp=Math.cos(p.pitch);if(shoot(p,-Math.sin(p.yaw)*cp,Math.sin(p.pitch),-Math.cos(p.yaw)*cp,(guns[p.gun].spread+speed*.006+p.recoil)*(p.crouch?.65:1))){p.pitch=Math.min(1.4,p.pitch+guns[p.gun].kick);p.yaw+=(Math.random()-.5)*guns[p.gun].kick*.5;}}
  }
  bots(dt);
  for(const g of s.grenades){if(g.life<=0)continue;g.life-=dt;g.vy-=15*dt;const nx=g.x+g.vx*dt,nz=g.z+g.vz*dt;if(blocked(nx,g.z,.1))g.vx*=-.55;else g.x=nx;if(blocked(g.x,nz,.1))g.vz*=-.55;else g.z=nz;g.y+=g.vy*dt;if(g.y<.12){g.y=.12;g.vy=Math.abs(g.vy)*.4;g.vx*=.96;g.vz*=.96;}if(g.life<=0){s.explosion=.5;s.blastX=g.x;s.blastZ=g.z;audio.play('blast');for(const a of actors)if(a.alive){const d=Math.hypot(g.x-a.x,g.z-a.z);if(d<7&&visible(g.x,g.z,a.x,a.z,.7))hurt(a,125*(1-d/7),false,g.team===0?p:null);}note('FRAG detonated');}}
  s.plantProgress=0;s.defuseProgress=0;
  let interacting=false;
  if(p.alive&&keys.has('KeyE')&&Math.hypot(p.vx,p.vz)<.5){if(!s.bomb.active&&s.attack===0){for(const site of sites)if(Math.hypot(p.x-site.x,p.z-site.z)<2.7){interacting=true;p.plant+=dt;s.plantProgress=p.plant/3.2;if(p.plant>=3.2)plant(p.x,p.z);}}else if(s.bomb.active&&s.attack!==0&&Math.hypot(p.x-s.bomb.x,p.z-s.bomb.z)<2.3){interacting=true;p.defuse+=dt;s.defuseProgress=p.defuse/5;s.bomb.defuse=p.defuse;if(p.defuse>=5)finish(0,'Charge disarmed');}}else{p.plant=0;p.defuse=0;}
  if(!interacting){p.plant=0;p.defuse=0;}
  if(s.bomb.active){s.bomb.timer-=dt;if(Math.floor((s.bomb.timer+dt)*2)!==Math.floor(s.bomb.timer*2))audio.play('beep');if(s.bomb.timer<=0){s.explosion=1;s.blastX=s.bomb.x;s.blastZ=s.bomb.z;audio.play('blast');finish(s.attack,'Relay destroyed');}}
  else {s.timer-=dt;if(s.timer<=0)finish(1-s.attack,'Time expired');}
  let alive0=0,alive1=0;for(const a of actors)if(a.alive){if(a.team===0)alive0++;else alive1++;}
  if(!alive0&&!(s.bomb.active&&s.attack===0))finish(1,'Team eliminated');else if(!alive1&&!(s.bomb.active&&s.attack===1))finish(0,'Team eliminated');
  pressed.clear();
 }
 return {state:s,step,start,buy};
}
