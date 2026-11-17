import * as T from 'three';
import {blocks,sites} from './map.js';
export function createWorld(scene){
 const mats={wall:new T.MeshStandardMaterial({color:0xc3b29a,roughness:.92}),building:new T.MeshStandardMaterial({color:0x24575b,roughness:.78}),crate:new T.MeshStandardMaterial({color:0x9c5938,roughness:.7}),dark:new T.MeshStandardMaterial({color:0x243639,metalness:.65,roughness:.4}),copper:new T.MeshStandardMaterial({color:0xd27a45,metalness:.5,roughness:.45}),light:new T.MeshStandardMaterial({color:0x91f3df,emissive:0x45bda7,emissiveIntensity:2})};
 const geo=new T.BoxGeometry(1,1,1);
 function box(x,y,z,w,h,d,mat){const m=new T.Mesh(geo,mats[mat]||mat);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=m.receiveShadow=true;scene.add(m);return m;}
 const floor=new T.MeshStandardMaterial({color:0x6a7773,roughness:.95});box(0,-.2,0,45,.4,45,floor);
 for(const b of blocks){box(b.x,b.h/2,b.z,b.w,b.h,b.d,b.kind);if(b.kind==='building'){
   box(b.x,b.h+.12,b.z,b.w+.35,.25,b.d+.35,'dark');
   for(let z=b.minZ+.8;z<b.maxZ;z+=1.35){box(b.minX-.025,2.2,z,.055,2.7,.055,'copper');box(b.maxX+.025,2.2,z,.055,2.7,.055,'copper');}
   box(b.x,3.6,b.maxZ+.035,b.w-.6,.18,.08,'light');
  }if(b.kind==='crate'){box(b.x,.12,b.z,b.w+.08,.15,b.d+.08,'dark');for(let x=-1;x<=1;x+=2)box(b.x+x*b.w*.32,b.h/2,b.z,.1,b.h+.05,b.d+.08,'dark');}
 }
 // Overhead transfer gantries and suspended cables frame the sightlines.
 for(const z of [-18,-3,13]){box(-20,4,z,.3,8,.3,'dark');box(20,4,z,.3,8,.3,'dark');box(0,7.8,z,40,.35,.4,'copper');for(let x=-16;x<=16;x+=8)box(x,7.5,z,1.3,.08,.9,'light');}
 for(const x of [-20,20]){box(x,3,0,.22,.22,40,'copper');for(let z=-18;z<21;z+=6)box(x,1.5,z,.32,3,.32,'dark');}
 for(const site of sites){const ring=new T.Mesh(new T.RingGeometry(2.6,2.75,64),new T.MeshBasicMaterial({color:0xf8ba63,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(site.x,.015,site.z);scene.add(ring);box(site.x,.35,site.z,1.2,.7,1,'dark');box(site.x,.72,site.z,.85,.08,.7,'light');}
 // Lane paint and inset drainage strips.
 const paint=new T.MeshStandardMaterial({color:0xcbb782,roughness:1});
 for(const x of [-12,0,12])for(let z=18;z>-18;z-=3)if(!blocks.some(b=>Math.abs(x-b.x)<b.w/2&&Math.abs(z-b.z)<b.d/2))box(x,.012,z,.12,.02,1.1,paint);
 for(const x of [-19,19])box(x,.014,0,.4,.025,40,'dark');
 function sign(text,x,y,z,rotation=0,width=4){const c=document.createElement('canvas');c.width=768;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle='#153b3e';ctx.fillRect(0,0,768,192);ctx.fillStyle='#e9ddbd';ctx.font='bold 74px monospace';ctx.textAlign='center';ctx.fillText(text,384,115);ctx.fillStyle='#dc8753';ctx.fillRect(24,158,720,8);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(width,width/4),new T.MeshStandardMaterial({map:texture,roughness:.8}));m.position.set(x,y,z);m.rotation.y=rotation;scene.add(m);}
 sign('RELAY / 09',0,4.2,-21.4,0,10);sign('A / CONDENSER',-14,3.2,-21.4,0,7);sign('B / SWITCHYARD',14,3.2,-21.4,0,7);sign('CINDER WORKS',0,3.4,21.4,Math.PI,10);sign('01 →',-7,2.8,12.54,0,4);sign('← 02',7,2.8,12.54,0,4);
 // Distant stacks are scenery beyond the playable walls.
 for(let i=0;i<9;i++){const x=-26+i*7,z=-29-Math.sin(i)*3;box(x,4,z,4,8,5,'building');const m=new T.Mesh(new T.CylinderGeometry(.65,.9,10,12),mats.copper);m.position.set(x,11,z);scene.add(m);}
 scene.background=new T.Color(0xbac9bd);scene.fog=new T.Fog(0xbac9bd,35,100);
 scene.add(new T.HemisphereLight(0xd9eee6,0x556763,2.2));const sun=new T.DirectionalLight(0xffd4a0,3.4);sun.position.set(-20,32,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-30;sun.shadow.camera.right=30;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-30;sun.shadow.camera.far=90;sun.shadow.normalBias=.03;scene.add(sun);return {box,mats};
}
