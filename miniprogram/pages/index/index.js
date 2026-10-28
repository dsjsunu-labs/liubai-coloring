'use strict';
const E = require('../../utils/engine');
const R = require('../../utils/renderer');
const STORAGE_KEY = 'liubai-native-v1';
const CUTS = ['shard','curve','zigzag','round'];
const TEXTURES = ['none','marble','gem','pixel','glass','block','water'];
const MODES = [{id:'mosaic',name:'碎片'},{id:'glass',name:'彩绘玻璃'},{id:'line',name:'数字填色'},{id:'pixel',name:'像素拼豆'}];
const toast = title => wx.showToast({title,icon:'none'});

Page({
  data: {
    modes:MODES,mode:'mosaic',canvasSize:300,pieceCount:0,filledCount:0,
    paletteNames:[],paletteIndex:0,paletteName:'燕麦拿铁',paletteDesc:'',colors:[],swatchInk:[],colorIndex:2,colorLabel:'03 / 08',
    cutNames:['碎瓷','柔弧','锯齿','圆弧'],cutIndex:0,strength:50,
    textureNames:['无','大理石','宝石','像素','玻璃','方块','水流'],textureIndex:0,
    density:48,tool:'paint',busy:false,saving:false,canUndo:false,canRedo:false,
    imageImported:false,animationEnabled:true,light:false,
    instruction:'点按或拖动，为碎片上色。'
  },
  onLoad() {
    this._palettes=E.PALETTES.map(p=>Object.assign({},p,{colors:p.colors.slice()}));
    this._history=[];this._future=[];this._savedModes={};this._selection=-1;this._cutPoints=[];
    this._hidden=false;this._unloaded=false;this._importToken=0;
    this._model=Object.assign(E.make('mosaic',48,'shard',50),{mode:'mosaic',palette:this._palettes[0],texture:'none',textureStrength:70,phase:0,light:false});
    this.restore();if(this._model.textureStrength===undefined)this._model.textureStrength=70;this.sync();
  },
  onReady() {
    this.createSelectorQuery().select('#artCanvas').fields({node:true,size:true,rect:true})
      .select('#exportCanvas').fields({node:true}).select('#imageCanvas').fields({node:true})
      .exec(res=> {
        if(this._unloaded)return;
        if(!res[0]||!res[0].node) {toast('请使用支持 Canvas 2D 的微信版本');return;}
        this._canvas=res[0].node;this._exportCanvas=res[1].node;this._imageCanvas=res[2].node;
        this.measureCanvas();this.loadMaterials();
      });
  },
  loadMaterials() {
    this._materials={};
    ['marble','gem'].forEach(key=>{const img=this._canvas.createImage();img.onload=()=>{this._materials[key]=img;this.draw();};img.src='/assets/materials/'+key+'.jpg';});
  },
  changeTextureStrength(e){if(this.data.busy)return;const before=this.snapshot();this._model.textureStrength=Number(e.detail.value);this.commit(before);this.draw();},
  measureCanvas() {
    if(!this._canvas||this._unloaded)return;
    this.createSelectorQuery().select('#artCanvas').boundingClientRect(rect=> {
      if(!rect||this._unloaded)return;
      const size=Math.max(1,Math.round(rect.width));
      const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();
      this._dpr=Math.min(3,info.pixelRatio||2);this._rect=rect;this._rectScroll=this._scrollTop||0;
      this._canvas.width=Math.round(size*this._dpr);this._canvas.height=this._canvas.width;
      this._ctx=this._canvas.getContext('2d');
      this.setData({canvasSize:size},()=>this.draw());
    }).exec();
  },
  onResize(){this.finishStroke();this.stopAnimation();this.measureCanvas();},
  onPageScroll(e){this._scrollTop=e.scrollTop;},
  onHide(){this._hidden=true;this.finishStroke();this.stopAnimation();this.persist();},
  onShow(){this._hidden=false;if(this._canvas)this.draw();},
  onUnload(){this.finishStroke();this.stopAnimation();this.persist();this._unloaded=true;this._importToken++;clearTimeout(this._saveTimer);},
  sync(extra) {
    if(this._unloaded)return;
    const m=this._model,p=m.palette,index=this._palettes.indexOf(p);
    const instructions={paint:m.mode==='line'?'按数字选色，填好后数字会消失。':'点按或拖动，为碎片上色。',eraser:'点按或拖动，擦除已填的颜色。',spread:'点一片，颜色会沿相邻碎片逐片展开。',cut:'先选中一片，再点两个位置确定切线。'};
    this.setData(Object.assign({textureStrength:m.textureStrength===undefined?70:m.textureStrength,paletteCards:this._palettes.map((p,i)=>({name:p.name,colors:p.colors,index:i})),materialCards:TEXTURES.map((id,i)=>({id,index:i,name:this.data.textureNames[i]})),mode:m.mode,paletteIndex:Math.max(0,index),paletteNames:this._palettes.map(p=>p.name+' · '+p.tag),paletteName:p.name,paletteDesc:p.desc,colors:p.colors.slice(),swatchInk:p.colors.map(c=>E.oklabLightness(c)>.65?'#493d30':'#fff9ec'),colorLabel:String(this.data.colorIndex+1).padStart(2,'0')+' / 08',pieceCount:m.pieces.length,filledCount:m.pieces.filter(p=>p.color).length,canUndo:!!this._history.length,canRedo:!!this._future.length,imageImported:m.pieces.some(p=>p.imageTone!==undefined),instruction:instructions[this.data.tool]||instructions.paint},extra||{}));
  },
  draw() {
    if(!this._ctx||this._hidden||this._unloaded)return;
    R.render(this._ctx,this._canvas.width,this._model,{materials:this._materials,animation:this._animation,selection:this._selection,cutPoints:this._cutPoints});
    if(this._animation||this._model.texture==='water') {
      if(this._raf)this._canvas.cancelAnimationFrame(this._raf);
      this._raf=this._canvas.requestAnimationFrame(()=> {
        this._raf=0;
        if(this._animation&&Date.now()-this._animation.start>1750) {this._animation=null;this.setData({busy:false});}
        this._model.phase=(this._model.phase||0)+.025;this.draw();
      });
    }
  },
  stopAnimation() {
    clearTimeout(this._animationTimer);
    if(this._raf&&this._canvas)this._canvas.cancelAnimationFrame(this._raf);
    this._raf=0;this._animation=null;
    if(this.data.busy&&!this._importing)this.setData({busy:false});
  },
  snapshot() {
    return {model:Object.assign({},this._model,{pieces:this._model.pieces.map(p=>Object.assign({},p)),adjacency:this._model.adjacency.map(a=>a.slice())}),source:this._source,paletteIndex:this.data.paletteIndex,cutIndex:this.data.cutIndex,density:this.data.density,strength:this.data.strength,textureIndex:this.data.textureIndex};
  },
  commit(before) {this._history.push(before);if(this._history.length>30)this._history.shift();this._future=[];this.sync();this.scheduleSave();},
  applySnapshot(s) {
    this.stopAnimation();this._model=s.model;this._source=s.source;this._selection=-1;this._cutPoints=[];
    this.sync({cutIndex:s.cutIndex,density:s.density,strength:s.strength,textureIndex:s.textureIndex,light:s.model.light});this.draw();this.scheduleSave();
  },
  undo(){if(this.data.busy||!this._history.length)return;this.finishStroke();this._future.push(this.snapshot());this.applySnapshot(this._history.pop());},
  redo(){if(this.data.busy||!this._future.length)return;this.finishStroke();this._history.push(this.snapshot());this.applySnapshot(this._future.pop());},
  changeMode(e) {
    if(this.data.busy)return;
    const mode=e.currentTarget.dataset.mode;if(mode===this._model.mode)return;
    this.finishStroke();this.stopAnimation();
    this._savedModes[this._model.mode]={snapshot:this.snapshot(),history:this._history,future:this._future};
    const saved=this._savedModes[mode];this._selection=-1;this._cutPoints=[];this.setData({tool:'paint'});
    if(saved) {this._history=saved.history;this._future=saved.future;this.applySnapshot(saved.snapshot);}
    else {
      if((mode==='glass'||mode==='mosaic')&&(this._model.mode==='glass'||this._model.mode==='mosaic')) this._model=Object.assign({},this._model,{mode,pieces:this._model.pieces.map(p=>Object.assign({},p))});
      else {this._source=null;this._model=Object.assign(E.make(mode,this.data.density,CUTS[this.data.cutIndex],this.data.strength),{mode,palette:this._model.palette,texture:'none',phase:0,light:false});}
      this._history=[];this._future=[];this.sync({textureIndex:TEXTURES.indexOf(this._model.texture),light:this._model.light});this.draw();this.scheduleSave();
    }
  },
  selectColor(e){if(this.data.busy)return;this.finishStroke();this._selection=-1;this._cutPoints=[];this.setData({colorIndex:Number(e.currentTarget.dataset.index),tool:'paint'},()=>this.sync());this.draw();},
  selectTool(e){if(this.data.busy)return;this.finishStroke();this._selection=-1;this._cutPoints=[];this.setData({tool:e.currentTarget.dataset.tool},()=>this.sync());this.draw();},
  changePalette(e) {
    if(this.data.busy)return;this.finishStroke();const before=this.snapshot(),next=this._palettes[Number(e.currentTarget&&e.currentTarget.dataset.index!==undefined?e.currentTarget.dataset.index:e.detail.value)],old=this._model.palette.colors;
    this._model.pieces.forEach(p=>{if(p.color){let idx=old.indexOf(p.color);if(idx<0)idx=0;p.color=next.colors[idx];}});
    this._model.palette=next;this.commit(before);this.draw();
  },
  localPoint(e) {
    const touches=e.touches&&e.touches.length?e.touches:e.changedTouches;
    if(!touches||!touches.length||touches.length>1)return null;
    const t=touches[0];let x,y;
    if(Number.isFinite(t.x)&&Number.isFinite(t.y)){x=t.x;y=t.y;}
    else {x=t.clientX-this._rect.left;y=t.clientY-(this._rect.top-(this._scrollTop||0)+(this._rectScroll||0));}
    const size=this.data.canvasSize;x/=size;y/=size;
    return x>=0&&y>=0&&x<=1&&y<=1?{x,y}:null;
  },
  touchStart(e) {
    if(this.data.busy||!this._ctx)return;
    const pt=this.localPoint(e);if(!pt)return;this._lastPoint=pt;
    const index=E.pick(this._model.pieces,pt.x,pt.y);if(index<0)return;
    if(this.data.tool==='spread'){this.fillFrom(index);return;}
    if(this.data.tool==='cut'){this.cutAt(index,pt);return;}
    this._strokeBefore=this.snapshot();this._strokeChanged=false;this.paint(pt);
  },
  touchMove(e) {
    if(this.data.busy||!this._strokeBefore)return;
    const pt=this.localPoint(e);if(!pt)return;
    const from=this._lastPoint||pt,steps=Math.max(1,Math.min(80,Math.ceil(Math.hypot(pt.x-from.x,pt.y-from.y)*120)));
    for(let i=1;i<=steps;i++)this.paint({x:from.x+(pt.x-from.x)*i/steps,y:from.y+(pt.y-from.y)*i/steps},true);
    this._lastPoint=pt;this.draw();
  },
  touchEnd(){this.finishStroke();},
  paint(pt,defer) {
    const i=E.pick(this._model.pieces,pt.x,pt.y);if(i<0)return;
    const color=this.data.tool==='eraser'?null:this._model.palette.colors[this.data.colorIndex];if(this._model.pieces[i].color===color)return;
    this._model.pieces[i].color=color;this._strokeChanged=true;if(!defer)this.draw();
  },
  finishStroke(){if(!this._strokeBefore)return;const before=this._strokeBefore,changed=this._strokeChanged;this._strokeBefore=null;this._lastPoint=null;if(changed)this.commit(before);},
  cutAt(index,pt) {
    if(this._selection<0){this._selection=index;this._cutPoints=[];this.setData({instruction:'已选中碎片，请点切线的第一个位置。'});this.draw();return;}
    this._cutPoints.push(pt);
    if(this._cutPoints.length===1){this.setData({instruction:'再点一个位置，切开选中的碎片。'});this.draw();return;}
    const result=E.split(this._model.pieces,this._selection,this._cutPoints[0],pt,CUTS[this.data.cutIndex],this.data.strength);
    if(!result){this._cutPoints=[];this.setData({instruction:'切线需穿过选中碎片，请重新点两个位置。'});this.draw();return;}
    const before=this.snapshot();this._model.pieces[this._selection]=result[0];this._model.pieces.push(result[1]);this._model.adjacency=E.buildAdjacency(this._model.pieces);
    this._selection=-1;this._cutPoints=[];this.commit(before);this.draw();
  },
  autoFill(){if(this.data.busy)return;this.fillFrom(Math.max(0,E.pick(this._model.pieces,.5,.5)));},
  fillFrom(seed) {
    this.finishStroke();const before=this.snapshot(),m=this._model,colors=m.palette.colors,origin=m.pieces[seed];
    const previous=m.pieces.map(p=>p.color),max=Math.max(.01,...m.pieces.map(p=>Math.hypot(p.cx-origin.cx,p.cy-origin.cy)));
    m.pieces.forEach(p=>{const tone=p.imageTone!==undefined?p.imageTone:m.mode==='line'?(p.number-1)%8:Math.round(E.clamp(.08+Math.hypot(p.cx-origin.cx,p.cy-origin.cy)/max*.82,0,1)*7);p.color=colors[tone];});
    this._selection=-1;this._cutPoints=[];this.setData({tool:'paint'});this.commit(before);
    if(this.data.animationEnabled){
      this._animation={start:Date.now(),plan:E.spreadPlan(m.pieces,m.adjacency,seed),previous};this.setData({busy:true});
      // Native canvas RAF pauses outside the viewport. A separate deadline always unlocks tools.
      clearTimeout(this._animationTimer);
      this._animationTimer=setTimeout(()=>{if(this._unloaded)return;this._animation=null;this.setData({busy:false});this.draw();},1800);
      wx.pageScrollTo({selector:'.workbar',duration:180});
    }this.draw();
  },
  rebuild(changes) {
    if(this.data.busy)return;
    this.finishStroke();const before=this.snapshot();this.stopAnimation();this.setData(changes||{});const m=this._model;
    if(this._source&&(m.mode==='mosaic'||m.mode==='glass')) {
      const geometry=E.createImagePieces(this._source,this._source.colors||m.palette.colors,this.data.density);m.pieces=geometry.pieces;m.adjacency=geometry.adjacency;m.pieces.forEach(p=>p.color=m.palette.colors[p.imageTone]);
    } else {const geometry=E.make(m.mode,this.data.density,CUTS[this.data.cutIndex],this.data.strength);m.pieces=geometry.pieces;m.adjacency=geometry.adjacency;}
    this._selection=-1;this._cutPoints=[];this.commit(before);this.draw();
  },
  regenerate(){this.rebuild();},
  changeCut(e){if(this.data.imageImported){toast('图片沿色区切割，切法用于单切');this.setData({cutIndex:Number(e.detail.value)});this.scheduleSave();return;}this.rebuild({cutIndex:Number(e.detail.value)});},
  changeDensity(e){if(Number(e.detail.value)!==this.data.density)this.rebuild({density:Number(e.detail.value)});},
  changeStrength(e){if(Number(e.detail.value)!==this.data.strength)this.rebuild({strength:Number(e.detail.value)});},
  changeTexture(e){if(this.data.busy)return;const before=this.snapshot(),i=Number(e.currentTarget&&e.currentTarget.dataset.index!==undefined?e.currentTarget.dataset.index:e.detail.value);this._model.texture=TEXTURES[i];this.setData({textureIndex:i});this.commit(before);this.draw();},
  toggleAnimation(e){this.setData({animationEnabled:e.detail.value});this.scheduleSave();},
  toggleLight(e){const before=this.snapshot();this._model.light=e.detail.value;this.setData({light:e.detail.value});this.commit(before);this.draw();},
  clearAll(){if(this.data.busy)return;this.finishStroke();const before=this.snapshot();this._model.pieces.forEach(p=>p.color=null);this.commit(before);this.draw();},
  importImage() {
    if(this.data.busy||!this._imageCanvas)return;
    const success=res=>this.readImage(res.tempFiles?res.tempFiles[0].tempFilePath:res.tempFilePaths[0]);
    const fail=err=>{if(!/cancel/i.test(err.errMsg||''))toast('无法选择图片，请检查相册权限');};
    if(wx.chooseMedia)wx.chooseMedia({count:1,mediaType:['image'],sourceType:['album','camera'],sizeType:['compressed'],success,fail});
    else wx.chooseImage({count:1,sizeType:['compressed'],sourceType:['album','camera'],success,fail});
  },
  readImage(filePath) {
    this.finishStroke();this.stopAnimation();this._importing=true;const token=++this._importToken;
    this.setData({busy:true});wx.showLoading({title:'正在生成碎片',mask:true});
    const canvas=this._imageCanvas,img=canvas.createImage();
    const done=()=>{if(token!==this._importToken||this._unloaded)return;this._importing=false;wx.hideLoading();this.setData({busy:false});};
    img.onerror=()=>{done();toast('图片读取失败，请换一张图片');};
    img.onload=()=> {
      if(token!==this._importToken||this._unloaded)return;
      try {
        const before=this.snapshot(),N=160;canvas.width=canvas.height=N;const g=canvas.getContext('2d');g.drawImage(img,0,0,N,N);const border=g.getImageData(0,0,N,N).data;let rr=0,gg=0,bb=0,count=0;for(let k=0;k<N;k++){for(const pos of [k,N*(N-1)+k,k*N,k*N+N-1]){rr+=border[pos*4];gg+=border[pos*4+1];bb+=border[pos*4+2];count++;}}g.fillStyle='rgb('+Math.round(rr/count)+','+Math.round(gg/count)+','+Math.round(bb/count)+')';g.fillRect(0,0,N,N);const scale=Math.min(N/img.width,N/img.height);g.drawImage(img,(N-img.width*scale)/2,(N-img.height*scale)/2,img.width*scale,img.height*scale);
        const source=g.getImageData(0,0,N,N),colors=E.extractImagePalette(g,N);source.colors=colors;
        const previousPalette=this._palettes.find(p=>p.fromImage);
        const palette={name:'图片取色',tag:'图片',en:'FROM IMAGE',desc:'从图片提取八色，保留原图的明暗和轮廓。',colors,fromImage:true};
        if(previousPalette)this._palettes[this._palettes.indexOf(previousPalette)]=palette;else this._palettes.push(palette);
        const geometry=E.createImagePieces(source,colors,this.data.density);geometry.pieces.forEach(p=>p.color=colors[p.imageTone]);
        this._source=source;this._model=Object.assign(geometry,{mode:this._model.mode==='glass'?'glass':'mosaic',palette,texture:this._model.texture,textureStrength:this._model.textureStrength,phase:0,light:this._model.light});
        this._selection=-1;this._cutPoints=[];this.setData({tool:'paint'});this.commit(before);done();this.sync();this.draw();toast('已沿图片轮廓生成可填色碎片');
      } catch(err){done();toast('生成失败，请尝试尺寸较小的图片');console.error('image segmentation',err);}
    };img.src=filePath;
  },
  exportArt() {
    if(this.data.busy||this.data.saving||!this._exportCanvas)return;this.finishStroke();
    const options=[{name:'方形原作 · 1600 × 1600',w:1600,h:1600},{name:'手机壁纸 · 1320 × 2868',w:1320,h:2868},{name:'iPad 竖屏 · 2064 × 2752',w:2064,h:2752},{name:'iPad 横屏 · 2752 × 2064',w:2752,h:2064}];
    wx.showActionSheet({itemList:options.map(o=>o.name),success:res=>this.createExport(options[res.tapIndex])});
  },
  createExport(preset) {
    this.setData({saving:true});wx.showLoading({title:'正在生成作品',mask:true});
    try {
      const canvas=this._exportCanvas;canvas.width=preset.w;canvas.height=preset.h;const g=canvas.getContext('2d');
      if(preset.w===preset.h)R.render(g,preset.w,this._model,{numbers:false,materials:this._materials});
      else {const bg=g.createLinearGradient(0,0,preset.w,preset.h);bg.addColorStop(0,this._model.palette.colors[0]);bg.addColorStop(1,this._model.palette.colors[2]);g.fillStyle=bg;g.fillRect(0,0,preset.w,preset.h);const size=Math.floor(Math.min(preset.w,preset.h)*.9);g.save();g.translate((preset.w-size)/2,(preset.h-size)/2);R.render(g,size,this._model,{numbers:false,materials:this._materials});g.restore();}
      wx.canvasToTempFilePath({canvas,fileType:'png',destWidth:preset.w,destHeight:preset.h,success:res=>{wx.hideLoading();this.setData({saving:false});this.savePhoto(res.tempFilePath);},fail:err=>{wx.hideLoading();this.setData({saving:false});console.error('export',err);toast('生成失败，请尝试方形尺寸');}},this);
    } catch(err){wx.hideLoading();this.setData({saving:false});console.error('export',err);toast('生成失败，请稍后重试');}
  },
  savePhoto(filePath) {
    wx.saveImageToPhotosAlbum({filePath,success:()=>toast('作品已保存到相册'),fail:err=>{
      if(/auth|deny|denied/i.test(err.errMsg||''))wx.showModal({title:'允许保存作品',content:'请在设置中开启“保存到相册”，再点击保存。',confirmText:'打开设置',success:res=>{if(res.confirm)wx.openSetting({});}});
      else {wx.previewImage({urls:[filePath],current:filePath});toast('可长按预览图保存');}
    }});
  },
  scheduleSave(){clearTimeout(this._saveTimer);this._saveTimer=setTimeout(()=>this.persist(),650);},
  persist() {
    if(!this._model)return;
    try {const source=this._source?wx.arrayBufferToBase64(this._source.data.buffer):null,snap=this.snapshot();delete snap.source;wx.setStorageSync(STORAGE_KEY,{version:1,snapshot:snap,source,sourceColors:this._source?this._source.colors:null,colorIndex:this.data.colorIndex,animationEnabled:this.data.animationEnabled});}
    catch(err){console.warn('local save',err);if(!this._storageWarning){this._storageWarning=true;toast('本机保存空间不足，请导出作品保留');}}
  },
  restore() {
    try {
      const saved=wx.getStorageSync(STORAGE_KEY);
      if(saved&&saved.source&&saved.source.length===136536){let hash=2166136261;for(let i=0;i<saved.source.length;i++){hash^=saved.source.charCodeAt(i);hash=Math.imul(hash,16777619);}if((hash>>>0)===3184475159){wx.setStorageSync('liubai-demo-recovery',saved);wx.removeStorageSync(STORAGE_KEY);return;}}
      if(!saved||saved.version!==1||!saved.snapshot)return;const snap=saved.snapshot;if(!snap.model||!snap.model.pieces||!snap.model.pieces.length)return;if(snap.model.pieces.some(p=>!p.path||!Array.isArray(p.path.commands)))return;
      this._model=snap.model;let palette=this._palettes.find(p=>p.name===snap.model.palette.name);if(!palette){palette=snap.model.palette;this._palettes.push(palette);}this._model.palette=palette;
      this._source=saved.source?{data:new Uint8ClampedArray(wx.base64ToArrayBuffer(saved.source)),colors:saved.sourceColors||snap.model.palette.colors,width:160,height:160}:null;
      this.setData({cutIndex:snap.cutIndex,density:snap.density,strength:snap.strength,textureIndex:snap.textureIndex,colorIndex:saved.colorIndex||0,animationEnabled:saved.animationEnabled!==false,light:this._model.light});
    } catch(err){console.warn('restore',err);}
  },
  onShareAppMessage(){return {title:'留白 · 给片刻，留一点颜色',path:'/pages/index/index'};}
});
