export function createInput(canvas) {
  const input={keys:new Set(),pressed:new Set(),locked:false,fire:false,dx:0,dy:0};
  window.addEventListener('keydown',e=>{if(!e.repeat)input.pressed.add(e.code);input.keys.add(e.code);if(['Space','Tab','KeyB'].includes(e.code))e.preventDefault();});
  window.addEventListener('keyup',e=>input.keys.delete(e.code));
  window.addEventListener('mousemove',e=>{if(input.locked){input.dx+=e.movementX;input.dy+=e.movementY;}});
  window.addEventListener('mousedown',e=>{if(e.button===0&&input.locked)input.fire=true;});
  window.addEventListener('mouseup',()=>input.fire=false);
  function clear(){input.keys.clear();input.pressed.clear();input.fire=false;input.dx=input.dy=0;}
  window.addEventListener('blur',clear);
  document.addEventListener('pointerlockchange',()=>{input.locked=document.pointerLockElement===canvas;if(!input.locked)clear();});
  input.lock=()=>{const request=canvas.requestPointerLock();if(request)request.catch(()=>{});};
  return input;
}
