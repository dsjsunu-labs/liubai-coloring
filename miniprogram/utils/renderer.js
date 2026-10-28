'use strict';
const E = require('./engine');
const hash = n => { const x = Math.sin(n * 127.1 + 17.3) * 43758.5453; return x - Math.floor(x); };

function texture(g, p, kind, phase, amount, materials) {
  if (kind === 'none' || amount<=0) return;
  g.save(); E.trace(g,p.path); g.clip();
  const box=p.bbox;
  if((kind==='marble'||kind==='gem') && materials && materials[kind]) {
    g.save();
    g.globalCompositeOperation=kind==='gem'?'overlay':'soft-light';
    g.globalAlpha=Math.min(1,.35+amount*.65);
    g.drawImage(materials[kind],0,0,1,1);g.restore();
    // A second subtle luminance layer keeps the grain visible on very pale and dark colours.
    g.save();g.globalCompositeOperation='multiply';g.globalAlpha=amount*(kind==='gem'?.15:.12);g.drawImage(materials[kind],0,0,1,1);g.restore();
    if(kind==='marble'){g.restore();return;}
  }
  g.globalAlpha=amount;
  if(kind==='marble'||kind==='gem'||kind==='water') {
    const water=kind==='water';
    for(let i=0;i<(water?22:18);i++) {
      g.beginPath();
      for(let j=0;j<=28;j++) {
        const x=j/28,y=i/22-.1+Math.sin(x*9+i*.83+(water?phase:0))*.027+Math.sin(x*22+i)*.009;
        if(!j)g.moveTo(x,y);else g.lineTo(x,y);
      }
      g.lineWidth=water?.0025:(i%5===0?.002:.0007);
      g.strokeStyle=water?'rgba(232,255,255,.65)':kind==='gem'?'rgba(255,250,220,.18)':'rgba(42,36,31,.3)';g.stroke();
    }
    if(kind==='gem') {
      const cx=p.cx,cy=p.cy;
      for(let i=0;i<6;i++) {
        const angle=i*Math.PI/3,a=angle+Math.PI/3;
        const radius=Math.max(box.x1-box.x0,box.y1-box.y0)*1.2;
        g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(angle)*radius,cy+Math.sin(angle)*radius);g.lineTo(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius);g.closePath();
        g.fillStyle=i%2?'rgba(15,35,34,.13)':'rgba(255,253,228,.22)';g.fill();
      }
    }
  } else if(kind==='pixel'||kind==='block') {
    const step=kind==='pixel'?1/48:1/16;
    for(let y=Math.floor(box.y0/step);y<Math.ceil(box.y1/step);y++)for(let x=Math.floor(box.x0/step);x<Math.ceil(box.x1/step);x++) {
      const n=hash(x+y*53);g.fillStyle=n>.5?'rgba(255,255,255,'+(n*.34)+')':'rgba(0,0,0,'+((1-n)*.22)+')';g.fillRect(x*step,y*step,step,step);
      if(kind==='block'){
        g.fillStyle='rgba(255,255,255,.32)';g.fillRect(x*step,y*step,step,.006);g.fillRect(x*step,y*step,.006,step);
        g.fillStyle='rgba(12,20,18,.25)';g.fillRect(x*step,y*step+step-.006,step,.006);g.fillRect(x*step+step-.006,y*step,.006,step);
      }
    }
  } else if(kind==='glass') {
    const sheen=g.createLinearGradient(box.x0,box.y0,box.x1,box.y1);
    sheen.addColorStop(0,'rgba(255,255,255,.28)');sheen.addColorStop(.34,'rgba(255,255,255,.02)');sheen.addColorStop(.43,'rgba(255,255,255,.12)');sheen.addColorStop(.48,'rgba(255,255,255,.67)');sheen.addColorStop(.52,'rgba(255,255,255,.12)');sheen.addColorStop(.8,'rgba(255,255,255,.05)');sheen.addColorStop(1,'rgba(15,35,34,.2)');
    g.fillStyle=sheen;g.fillRect(0,0,1,1);
  }
  // A narrow bevel makes texture read as a surface instead of a flat pattern.
  if(kind!=='pixel') {
    g.save();g.translate(-.002,-.002);E.trace(g,p.path);g.strokeStyle='rgba(255,252,232,.6)';g.lineWidth=.004;g.stroke();g.restore();
    g.save();g.translate(.002,.002);E.trace(g,p.path);g.strokeStyle='rgba(18,24,22,.22)';g.lineWidth=.003;g.stroke();g.restore();
  }
  g.restore();
}

function render(g,size,model,opts) {
  opts=opts||{};
  const {pieces,mode,palette}=model,glass=mode==='glass',now=opts.now===undefined?Date.now():opts.now;
  g.save();g.clearRect(0,0,size,size);g.fillStyle=glass?(model.light?'#fff2cf':'#f9f1e2'):'#fbf8f1';g.fillRect(0,0,size,size);g.scale(size,size);
  g.beginPath();g.rect(0,0,1,1);g.clip();g.lineJoin='round';g.lineCap='round';
  pieces.forEach((p,i)=> {
    let progress=1,hinge=null;
    if(opts.animation){const plan=opts.animation.plan[i];progress=E.clamp((now-opts.animation.start-plan.delay)/650,0,1);progress=1-Math.pow(1-progress,3);hinge=plan.hinge;}
    const old=opts.animation&&opts.animation.previous[i];
    E.trace(g,p.path);g.fillStyle=old||'#fbf8f1';g.fill();
    if(!p.color||!progress)return;
    g.save();E.trace(g,p.path);g.clip();
    if(progress<1) {
      const a=hinge?hinge.a:{x:p.bbox.x0,y:p.bbox.y0},b=hinge?hinge.b:{x:p.bbox.x1,y:p.bbox.y0};
      const angle=Math.atan2(b.y-a.y,b.x-a.x);g.translate(a.x,a.y);g.rotate(angle);g.transform(1,0,(1-progress)*.1,Math.max(.012,Math.sin(progress*Math.PI/2)),0,0);g.rotate(-angle);g.translate(-a.x,-a.y);
    }
    g.fillStyle=p.color;
    const tone=palette.colors.indexOf(p.color);
    if(palette.tag==='黑金'&&tone>=0&&tone<5) {
      const gold=g.createLinearGradient(p.bbox.x0,p.bbox.y0,p.bbox.x1,p.bbox.y1);
      gold.addColorStop(0,p.color);gold.addColorStop(.36,'#fff4bd');gold.addColorStop(.45,p.color);gold.addColorStop(.7,p.color);gold.addColorStop(.75,'#ffe7a0');gold.addColorStop(1,p.color);g.fillStyle=gold;
    }
    E.trace(g,p.path);g.fill();
    if(progress<1) {
      const shade=g.createLinearGradient(p.bbox.x0,p.bbox.y0,p.bbox.x1,p.bbox.y1);
      shade.addColorStop(0,'rgba(255,251,233,'+(.55*(1-progress))+')');shade.addColorStop(1,'rgba(25,20,15,'+(.4*(1-progress))+')');g.fillStyle=shade;E.trace(g,p.path);g.fill();
    } else {
      const amount=(model.textureStrength===undefined?70:model.textureStrength)/100;
      texture(g,p,model.texture,model.phase||0,amount,opts.materials);
      if(glass&&model.texture!=='glass')texture(g,p,'glass',0,.35,opts.materials);
    }
    g.restore();
  });
  pieces.forEach(p=> {
    E.trace(g,p.path);g.lineWidth=mode==='pixel'?.0007:glass?.004:.0015;g.strokeStyle=glass?'#3c3a37':'rgba(70,58,45,.24)';g.stroke();
    if(glass){g.lineWidth=.0008;g.strokeStyle='rgba(246,233,209,.38)';g.stroke();}
    if(mode==='line'&&!p.color&&opts.numbers!==false) {
      g.fillStyle='#938777';g.font='.018px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(String((p.number-1)%8+1),p.cx,p.cy);
    }
  });
  if(opts.selection>=0&&pieces[opts.selection]) {E.trace(g,pieces[opts.selection].path);g.lineWidth=.005;g.strokeStyle='#a15f3b';g.stroke();}
  if(opts.cutPoints&&opts.cutPoints.length) {
    const points=opts.cutPoints;g.fillStyle='#a15f3b';points.forEach(p=>{g.beginPath();g.arc(p.x,p.y,.009,0,7);g.fill();});
    if(points.length>1){g.beginPath();g.moveTo(points[0].x,points[0].y);g.lineTo(points[1].x,points[1].y);g.lineWidth=.003;g.strokeStyle='#a15f3b';g.stroke();}
  }
  g.restore();
}
module.exports={render};
