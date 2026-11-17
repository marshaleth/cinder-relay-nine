// Original synthesized sounds; no downloads, sample assets or background audio.
export function createAudio() {
  let ctx,noise;
  return {
    start(){if(!ctx){ctx=new AudioContext();noise=ctx.createBuffer(1,ctx.sampleRate*.3,ctx.sampleRate);const a=noise.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length)**3;}ctx.resume();},
    play(type,pan=0){if(!ctx)return;const t=ctx.currentTime,g=ctx.createGain(),p=ctx.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));g.connect(p);p.connect(ctx.destination);
      if(type==='shot'||type==='enemy'||type==='blast'){const s=ctx.createBufferSource(),f=ctx.createBiquadFilter();s.buffer=noise;f.type='lowpass';f.frequency.value=type==='blast'?500:type==='enemy'?900:2600;s.connect(f);f.connect(g);g.gain.setValueAtTime(type==='enemy'?.13:type==='blast'?.7:.32,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);s.start(t);s.stop(t+.3);}
      else {const s=ctx.createOscillator();s.type=type==='hit'?'triangle':'sine';s.frequency.setValueAtTime(type==='hit'?900:type==='kill'?1300:type==='step'?90:460,t);s.frequency.exponentialRampToValueAtTime(100,t+.09);s.connect(g);g.gain.setValueAtTime(type==='step'?.035:.09,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);s.start(t);s.stop(t+.13);}
    }
  };
}
