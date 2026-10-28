'use strict';
// Native geometry and palette engine. No browser, DOM, network or framework dependency.
class Path2D {
  constructor() {this.commands=[];}
  moveTo(...a){this.commands.push(['moveTo',a]);}
  lineTo(...a){this.commands.push(['lineTo',a]);}
  quadraticCurveTo(...a){this.commands.push(['quadraticCurveTo',a]);}
  arc(...a){this.commands.push(['arc',a]);}
  rect(...a){this.commands.push(['rect',a]);}
  closePath(){this.commands.push(['closePath',[]]);}
  addPath(path){this.commands.push(...path.commands);}
}
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const UNIT_SQUARE=[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}];
const state={cutStyle:'shard',cutStrength:50};
  const PALETTES = [
    {
      name: '燕麦拿铁', en: 'OAT LATTE', tag: '奶咖',
      desc: '奶油、燕麦与可可，一杯温度和刚好。',
      colors: ['#FAF4E9','#F0E4D2','#E1CCB1','#CEB08D','#B18B66','#906B4B','#6B4D35','#46301F']
    },
    {
      name: '黑糖珍珠', en: 'BROWN SUGAR', tag: '奶咖',
      desc: '焦糖挂壁的深棕，甜得很克制。',
      colors: ['#F8EDDF','#EDD9BF','#DCBE9B','#C69B71','#A97750','#8A5836','#643A22','#3F2114']
    },
    {
      name: '赤陶日落', en: 'TERRACOTTA', tag: '陶土',
      desc: '晒过太阳的陶土、砖红与沙。',
      colors: ['#FBEFDF','#F3D8BC','#E7B991','#D7956B','#BD7048','#9C5331','#743720','#4C2013']
    },
    {
      name: '黄油曲奇', en: 'BUTTER COOKIE', tag: '烘焙',
      desc: '烤盘边的奶黄，和一点点焦。',
      colors: ['#FDF6E1','#F8EAC6','#EFD8A2','#DFBF77','#CBA155','#AA7D3C','#805A29','#583B18']
    },
    {
      name: '玄金', en: 'BLACK GOLD', tag: '黑金',
      desc: '黑漆、香槟金与旧铜，暗处流动的光。',
      colors: ['#FFF9E9','#F7E4B0','#F1CC74','#E4B143','#C98D2A','#8F5E22','#4B321D','#120D08']
    },
    {
      name: '马蒂斯', en: 'MATISSE', tag: '艺术',
      desc: '《舞蹈》里的蓝、绿与粉，围成一圈。',
      colors: ['#F7F0E4','#A9C6D8','#F2A29B','#078C66','#2168A6','#03735E','#165F8C','#0E2A36']
    },
    {
      name: '梵高', en: 'VAN GOGH', tag: '艺术',
      desc: '《星夜》的钴蓝、柏树绿与星光黄。',
      colors: ['#F7F0D8','#D8D19A','#C7AD24','#8EA7D4','#6283C8','#2B41A7','#1A3431','#151C2B']
    },
    {
      name: '莫奈', en: 'MONET', tag: '艺术',
      desc: '《睡莲》的灰紫、湖水蓝与一抹胭脂。',
      colors: ['#F3E9DE','#D5C6D8','#B985BA','#7EA860','#4885A4','#9F4640','#395A92','#2A4A55']
    },
    {
      name: '克里姆特', en: 'KLIMT', tag: '艺术',
      desc: '《吻》的金、孔雀绿与紫，华丽而暗涌。',
      colors: ['#F7EFD9','#E8C7A8','#E3C454','#A27CBA','#609F5C','#B85031','#4A5FAB','#2A2828']
    },
    {
      name: '霍克尼', en: 'HOCKNEY', tag: '艺术',
      desc: '《大水花》的泳池蓝、加州绿与奶油。',
      colors: ['#F6F0E3','#E7C7B5','#CABD8A','#79BED9','#B28D7B','#497E58','#126599','#123842']
    },
    {
      name: '北斋', en: 'HOKUSAI', tag: '艺术',
      desc: '《神奈川冲浪里》的靛蓝、米白与浪花。',
      colors: ['#F7F2E4','#ECE2C6','#D9CCAC','#9DB4C2','#6E6352','#2D4472','#1F284C','#101A2B']
    },
    {
      name: '干枯玫瑰', en: 'DUSTY ROSE', tag: '花木',
      desc: '褪色花瓣的灰粉，不甜腻的浪漫。',
      colors: ['#F9EEE9','#F0DCD5','#E0C2BC','#CBA29E','#B3807E','#946060','#6F4145','#4B282F']
    },
    {
      name: '酒红天鹅绒', en: 'VELVET', tag: '花木',
      desc: '陈年酒红压在丝绒底下，暗而贵。',
      colors: ['#F5E9E1','#E9D1C7','#D5AEA5','#BE8A84','#A15C61','#813743','#5A1F2E','#3A0F1C']
    },
    {
      name: '蜜桃乌龙', en: 'PEACH OOLONG', tag: '果茶',
      desc: '三分糖的桃肉与乌龙茶汤。',
      colors: ['#FCF1E5','#F7DFCB','#F1C6AA','#E5A585','#D18263','#B4634A','#8A4735','#602B20']
    },
    {
      name: '紫雾', en: 'LILAC MIST', tag: '花木',
      desc: '黄昏最后一场薰衣草色的雾。',
      colors: ['#F6F1F3','#EADFE5','#D6C4D1','#BFA6B9','#A284A1','#846685','#644868','#472F4B']
    },
    {
      name: '莫兰迪', en: 'MORANDI', tag: '灰调',
      desc: '灰粉、雾蓝与橄榄，所有颜色都退后一步。',
      colors: ['#F8F3E7','#F5ECC2','#D9C7AE','#97ACC8','#B59392','#6C7566','#3D4A45','#253122']
    },
    {
      name: '侘寂', en: 'WABI-SABI', tag: '土色',
      desc: '稻草、旧墙与深橄榄，时间留下的哑光。',
      colors: ['#FBF7E8','#F5ECC2','#EBCFA4','#EEB480','#B48A55','#837E31','#56562B','#253122']
    },
    {
      name: '旧画室', en: 'STILL LIFE', tag: '油画',
      desc: '亚麻、赭石与青灰，像一幅未干的静物。',
      colors: ['#FCF8EC','#F5ECC2','#EAD3AE','#D8A37B','#B57B52','#71502F','#34454C','#202B30']
    },
    {
      name: '敦煌', en: 'DUNHUANG', tag: '东方',
      desc: '石青、石绿与朱砂，壁画里的矿物色。',
      colors: ['#F7EFDF','#E7D3B2','#D2A866','#B96A48','#5E887E','#8C4633','#2F5670','#292724']
    },
    {
      name: '青碧', en: 'QINGBI', tag: '青色',
      desc: '雨后的天青、青瓷与深海，一口冷气。',
      colors: ['#EEF8F6','#D2EAE7','#ABD5D2','#7FBDBD','#58A4A8','#377E85','#235A63','#143A42']
    },
    {
      name: '雾霭青瓷', en: 'CELADON', tag: '山水',
      desc: '雨过天青，安静得能听见风。',
      colors: ['#F2F5EF','#E1E9E0','#CBD9CF','#B0C6BA','#90AB9F','#6F8C81','#506A62','#344842']
    },
    {
      name: '苔藓森林', en: 'MOSS', tag: '草木',
      desc: '潮湿林地，苔藓与老树皮的绿。',
      colors: ['#F5F3E6','#E6E7D2','#CFD5B5','#B2BF94','#909F71','#6F8152','#50613B','#354428']
    },
    {
      name: '抹茶白巧', en: 'MATCHA', tag: '草木',
      desc: '微苦抹茶，融化在一整块白巧里。',
      colors: ['#FCFAEF','#EFF0D7','#DDE2B3','#C4D08D','#A5B56A','#84984E','#627636','#445524']
    },
    {
      name: '橄榄与米', en: 'OLIVE', tag: '田园',
      desc: '地中海餐桌上的橄榄与面包。',
      colors: ['#F8F4E7','#EEE7D1','#DED3B2','#C7B88A','#A99767','#8A784A','#675732','#473C20']
    },
    {
      name: '青柠气泡', en: 'LIME', tag: '果茶',
      desc: '气泡水里的青柠皮，清醒一下。',
      colors: ['#F9F8E9','#EDEFCC','#DEE4A7','#C8D27B','#ACBA52','#8FA037','#708024','#53601A']
    },
    {
      name: '深海盐', en: 'SEA SALT', tag: '海',
      desc: '海水晒成盐粒，留下清冷的蓝。',
      colors: ['#F2F6F7','#E0EAEC','#C5D8DC','#A3BFC6','#7F9FA9','#5D7E8A','#3F5E6B','#27434F']
    },
    {
      name: '普鲁士蓝', en: 'PRUSSIAN', tag: '夜色',
      desc: '旧画册里的墨水蓝，配一点米白。',
      colors: ['#F6F3E9','#E6E3D5','#CDD0CA','#ACB6B8','#83969F','#5B7280','#3B5363','#223947']
    },
    {
      name: '石墨与银', en: 'GRAPHITE', tag: '灰度',
      desc: '铅笔、金属与雾，克制的灰度。',
      colors: ['#F8F6F1','#E8E6E0','#D3D1CB','#B9B7B1','#9B9A95','#7B7A75','#595954','#3A3A37']
    }
  ];

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }

  function hexToRgba(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function mixHex(base, tint, amount) {
    const a = hexToRgb(base);
    const b = hexToRgb(tint);
    const mix = (x, y) => Math.round(x + (y - x) * amount);
    return `#${[mix(a.r, b.r), mix(a.g, b.g), mix(a.b, b.b)]
      .map(v => v.toString(16).padStart(2, '0')).join('')}`;
  }

  function oklabLightness(hex) {
    const { r, g, b } = hexToRgb(hex);
    const lin = v => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const R = lin(r);
    const G = lin(g);
    const B = lin(b);
    const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
    const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
    const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
    return 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  }

  function colorDistance(a, b) {
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    return (ca.r - cb.r) ** 2 + (ca.g - cb.g) ** 2 + (ca.b - cb.b) ** 2;
  }

  function nearestColorIndex(hex, colors) {
    let best = 0;
    let bestD = Infinity;
    colors.forEach((c, i) => {
      const d = colorDistance(hex, c);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  function sampleSeeds(n) {
    const points = [];
    const minDist = 0.62 / Math.sqrt(n);
    const minDist2 = minDist * minDist;
    let guard = 0;
    const limit = n * 500;

    while (points.length < n && guard < limit) {
      guard++;
      const x = 0.012 + Math.random() * 0.976;
      const y = 0.012 + Math.random() * 0.976;
      let ok = true;
      for (let i = 0; i < points.length; i++) {
        const dx = points[i].x - x;
        const dy = points[i].y - y;
        if (dx * dx + dy * dy < minDist2) { ok = false; break; }
      }
      if (ok) points.push({ x, y });
    }
    while (points.length < n) {
      points.push({ x: 0.012 + Math.random() * 0.976, y: 0.012 + Math.random() * 0.976 });
    }
    return points;
  }

  function clipHalfPlane(poly, nx, ny, c) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const da = nx * a.x + ny * a.y - c;
      const db = nx * b.x + ny * b.y - c;

      if (da <= 0) out.push(a);
      if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
        const t = da / (da - db);
        out.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
      }
    }
    return out;
  }

  function cleanPolygon(poly) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const prev = out[out.length - 1];
      if (!prev || Math.abs(prev.x - p.x) > 1e-8 || Math.abs(prev.y - p.y) > 1e-8) out.push(p);
    }
    if (out.length > 1) {
      const a = out[0];
      const b = out[out.length - 1];
      if (Math.abs(a.x - b.x) < 1e-8 && Math.abs(a.y - b.y) < 1e-8) out.pop();
    }
    return out;
  }

  function polygonAreaCentroid(poly) {
    let area = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const cross = a.x * b.y - b.x * a.y;
      area += cross;
      cx += (a.x + b.x) * cross;
      cy += (a.y + b.y) * cross;
    }
    area *= 0.5;
    if (Math.abs(area) < 1e-10) {
      let ax = 0, ay = 0;
      poly.forEach(p => { ax += p.x; ay += p.y; });
      return { area: 0, cx: ax / poly.length, cy: ay / poly.length };
    }
    return { area, cx: cx / (6 * area), cy: cy / (6 * area) };
  }

  function makeVoronoi(n) {
    const seeds = sampleSeeds(n);
    const cells = [];

    for (let i = 0; i < n; i++) {
      const a = seeds[i];
      let poly = UNIT_SQUARE.slice();

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const b = seeds[j];
        const nx = 2 * (b.x - a.x);
        const ny = 2 * (b.y - a.y);
        const c = (b.x * b.x + b.y * b.y) - (a.x * a.x + a.y * a.y);
        poly = clipHalfPlane(poly, nx, ny, c);
        if (poly.length < 3) break;
      }

      poly = cleanPolygon(poly);
      if (poly.length < 3) continue;

      const geo = polygonAreaCentroid(poly);
      if (!isFinite(geo.cx) || !isFinite(geo.cy)) continue;
      if (Math.abs(geo.area) < 1e-7) continue;

      cells.push({ poly, cx: geo.cx, cy: geo.cy });
    }
    return cells;
  }

  function edgeKey(a, b) {
    const ka = `${a.x.toFixed(5)},${a.y.toFixed(5)}`;
    const kb = `${b.x.toFixed(5)},${b.y.toFixed(5)}`;
    return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
  }

  function isBoundaryPoint(p) {
    const e = 1e-7;
    return p.x < e || p.x > 1 - e || p.y < e || p.y > 1 - e;
  }

  function buildEdgeMap(cells, style, strength) {
    const map = new Map();

    for (const cell of cells) {
      const poly = cell.poly;
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        const key = edgeKey(a, b);
        if (map.has(key)) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        const edge = { a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y }, ctrl: null, points: null };

        if (!(isBoundaryPoint(a) && isBoundaryPoint(b)) && len > 1e-6) {
          const nx = -dy / len;
          const ny = dx / len;

          if (style === 'curve') {
            const offset = (Math.random() * 2 - 1) * len * 0.26 * strength;
            edge.ctrl = {
              x: (a.x + b.x) / 2 + nx * offset,
              y: (a.y + b.y) / 2 + ny * offset
            };
          } else if (style === 'zigzag') {
            const teeth = 3;
            const amplitude = len * 0.15 * strength;
            const sign = Math.random() < 0.5 ? -1 : 1;
            edge.points = [];
            for (let k = 0; k < teeth; k++) {
              const t = (k + 0.5) / teeth;
              const offset = amplitude * (k % 2 === 0 ? sign : -sign);
              edge.points.push({
                x: a.x + dx * t + nx * offset,
                y: a.y + dy * t + ny * offset
              });
            }
          }
        }
        map.set(key, edge);
      }
    }
    return map;
  }

  function buildStraightPath(poly) {
    const path = new Path2D();
    poly.forEach((pt, i) => {
      if (i === 0) path.moveTo(pt.x, pt.y);
      else path.lineTo(pt.x, pt.y);
    });
    path.closePath();
    return path;
  }

  function buildCurvePath(poly, edges) {
    const path = new Path2D();
    path.moveTo(poly[0].x, poly[0].y);

    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const edge = edges.get(edgeKey(a, b));
      if (edge && edge.ctrl) {
        path.quadraticCurveTo(edge.ctrl.x, edge.ctrl.y, b.x, b.y);
      } else {
        path.lineTo(b.x, b.y);
      }
    }
    path.closePath();
    return path;
  }

  function buildZigzagPath(poly, edges) {
    const path = new Path2D();
    path.moveTo(poly[0].x, poly[0].y);

    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const edge = edges.get(edgeKey(a, b));

      if (edge && edge.points && edge.points.length) {
        const forward = Math.hypot(a.x - edge.a.x, a.y - edge.a.y) < 1e-5;
        const points = forward ? edge.points : edge.points.slice().reverse();
        for (const pt of points) path.lineTo(pt.x, pt.y);
      }
      path.lineTo(b.x, b.y);
    }
    path.closePath();
    return path;
  }

  function pointToward(from, to, distance) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) return { x: from.x, y: from.y };
    const t = Math.min(distance / len, 0.45);
    return { x: from.x + dx * t, y: from.y + dy * t };
  }

  function buildRoundPath(poly, strength) {
    if (strength < 0.01) return buildStraightPath(poly);

    const n = poly.length;
    const radii = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const v = poly[i];
      if (isBoundaryPoint(v)) continue;
      const prev = poly[(i - 1 + n) % n];
      const next = poly[(i + 1) % n];
      const lenPrev = Math.hypot(v.x - prev.x, v.y - prev.y);
      const lenNext = Math.hypot(next.x - v.x, next.y - v.y);
      radii[i] = Math.min(lenPrev, lenNext) * 0.24 * strength;
    }

    const v0 = poly[0];
    const start = radii[0] > 0 ? pointToward(v0, poly[n - 1], radii[0]) : { x: v0.x, y: v0.y };
    const path = new Path2D();
    path.moveTo(start.x, start.y);

    for (let i = 0; i < n; i++) {
      const v = poly[i];
      const next = poly[(i + 1) % n];
      const prev = poly[(i - 1 + n) % n];
      const radius = radii[i];

      if (radius > 1e-4) {
        const pPrev = pointToward(v, prev, radius);
        const pNext = pointToward(v, next, radius);
        if (i !== 0) path.lineTo(pPrev.x, pPrev.y);
        path.quadraticCurveTo(v.x, v.y, pNext.x, pNext.y);
      } else {
        path.lineTo(v.x, v.y);
      }
    }
    path.closePath();
    return path;
  }

  function pushOutlinePoint(points, x, y) {
    const last = points[points.length - 1];
    if (!last || Math.abs(last.x - x) > 1e-7 || Math.abs(last.y - y) > 1e-7) {
      points.push({ x, y });
    }
  }

  function flattenCurveOutline(poly, edges) {
    const steps = 10;
    const points = [];

    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const edge = edges.get(edgeKey(a, b));

      if (edge && edge.ctrl) {
        for (let s = 0; s < steps; s++) {
          const t = s / steps;
          const mt = 1 - t;
          pushOutlinePoint(
            points,
            mt * mt * a.x + 2 * mt * t * edge.ctrl.x + t * t * b.x,
            mt * mt * a.y + 2 * mt * t * edge.ctrl.y + t * t * b.y
          );
        }
      } else {
        pushOutlinePoint(points, a.x, a.y);
      }
    }
    return points;
  }

  function flattenZigzagOutline(poly, edges) {
    const points = [];

    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const edge = edges.get(edgeKey(a, b));
      pushOutlinePoint(points, a.x, a.y);

      if (edge && edge.points && edge.points.length) {
        const forward = Math.hypot(a.x - edge.a.x, a.y - edge.a.y) < 1e-5;
        const pts = forward ? edge.points : edge.points.slice().reverse();
        for (const pt of pts) pushOutlinePoint(points, pt.x, pt.y);
      }
    }
    return points;
  }

  function flattenRoundOutline(poly, strength) {
    if (strength < 0.01) return poly.map(p => ({ x: p.x, y: p.y }));

    const n = poly.length;
    const radii = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const v = poly[i];
      if (isBoundaryPoint(v)) continue;
      const prev = poly[(i - 1 + n) % n];
      const next = poly[(i + 1) % n];
      const lenPrev = Math.hypot(v.x - prev.x, v.y - prev.y);
      const lenNext = Math.hypot(next.x - v.x, next.y - v.y);
      radii[i] = Math.min(lenPrev, lenNext) * 0.24 * strength;
    }

    const points = [];
    const steps = 6;

    for (let i = 0; i < n; i++) {
      const v = poly[i];
      const next = poly[(i + 1) % n];
      const prev = poly[(i - 1 + n) % n];
      const radius = radii[i];

      if (radius > 1e-4) {
        const pPrev = pointToward(v, prev, radius);
        const pNext = pointToward(v, next, radius);
        pushOutlinePoint(points, pPrev.x, pPrev.y);
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const mt = 1 - t;
          pushOutlinePoint(
            points,
            mt * mt * pPrev.x + 2 * mt * t * v.x + t * t * pNext.x,
            mt * mt * pPrev.y + 2 * mt * t * v.y + t * t * pNext.y
          );
        }
      } else {
        pushOutlinePoint(points, v.x, v.y);
      }
    }
    return points;
  }

  function createPieces(n) {
    const cells = makeVoronoi(n);
    const style = state.cutStyle;
    const strength = state.cutStrength / 100;
    const edges = style === 'curve' || style === 'zigzag'
      ? buildEdgeMap(cells, style, strength)
      : null;

    return cells.map(cell => {
      let path;
      let outline;

      if (style === 'curve') {
        path = buildCurvePath(cell.poly, edges);
        outline = flattenCurveOutline(cell.poly, edges);
      } else if (style === 'zigzag') {
        path = buildZigzagPath(cell.poly, edges);
        outline = flattenZigzagOutline(cell.poly, edges);
      } else if (style === 'round') {
        path = buildRoundPath(cell.poly, strength);
        outline = flattenRoundOutline(cell.poly, strength);
      } else {
        path = buildStraightPath(cell.poly);
        outline = cell.poly.map(p => ({ x: p.x, y: p.y }));
      }

      let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
      cell.poly.forEach(pt => {
        if (pt.x < x0) x0 = pt.x;
        if (pt.y < y0) y0 = pt.y;
        if (pt.x > x1) x1 = pt.x;
        if (pt.y > y1) y1 = pt.y;
      });

      return {
        poly: cell.poly,
        path,
        outline,
        bbox: { x0, y0, x1, y1 },
        cx: cell.cx,
        cy: cell.cy,
        color: null
      };
    });
  }

  function buildAdjacency(pieces) {
    const n = pieces.length;
    const adj = Array.from({ length: n }, () => []);
    const eps2 = 1e-10;

    for (let i = 0; i < n; i++) {
      const a = pieces[i].poly;
      for (let j = i + 1; j < n; j++) {
        const b = pieces[j].poly;
        let shared = 0;
        for (let ai = 0; ai < a.length && shared < 2; ai++) {
          for (let bi = 0; bi < b.length; bi++) {
            const dx = a[ai].x - b[bi].x;
            const dy = a[ai].y - b[bi].y;
            if (dx * dx + dy * dy < eps2) { shared++; break; }
          }
        }
        if (shared >= 2) {
          adj[i].push(j);
          adj[j].push(i);
        }
      }
    }
    return adj;
  }

  function buildNearestAdjacency(pieces, k = 4) {
    const adj = Array.from({ length: pieces.length }, () => new Set());
    for (let i = 0; i < pieces.length; i++) {
      const a = pieces[i];
      const distances = [];
      for (let j = 0; j < pieces.length; j++) {
        if (i === j) continue;
        const b = pieces[j];
        distances.push({ j, d: (a.cx - b.cx) ** 2 + (a.cy - b.cy) ** 2 });
      }
      distances.sort((p, q) => p.d - q.d);
      for (let m = 0; m < Math.min(k, distances.length); m++) {
        adj[i].add(distances[m].j);
        adj[distances[m].j].add(i);
      }
    }
    return adj.map(set => Array.from(set));
  }

  function createMandalaPieces() {
    const cx = 0.5;
    const cy = 0.5;
    const pieces = [];
    const ringDefs = [
      { inner: 0.082, outer: 0.162, sectors: 8 },
      { inner: 0.162, outer: 0.252, sectors: 12 },
      { inner: 0.252, outer: 0.352, sectors: 16 },
      { inner: 0.352, outer: 0.458, sectors: 12 }
    ];

    const centerPath = new Path2D();
    centerPath.arc(cx, cy, 0.082, 0, Math.PI * 2);
    centerPath.closePath();
    pieces.push({
      poly: Array.from({ length: 24 }, (_, i) => ({
        x: cx + Math.cos((i / 24) * Math.PI * 2) * 0.082,
        y: cy + Math.sin((i / 24) * Math.PI * 2) * 0.082
      })),
      path: centerPath,
      outline: null,
      bbox: { x0: cx - 0.082, y0: cy - 0.082, x1: cx + 0.082, y1: cy + 0.082 },
      cx,
      cy,
      color: null,
      number: 1,
      ring: -1,
      sector: 0
    });

    ringDefs.forEach((def, ringIndex) => {
      const gap = 0.009;
      for (let s = 0; s < def.sectors; s++) {
        const a0 = (s / def.sectors) * Math.PI * 2 + gap;
        const a1 = ((s + 1) / def.sectors) * Math.PI * 2 - gap;
        const path = new Path2D();
        path.arc(cx, cy, def.outer, a0, a1);
        path.arc(cx, cy, def.inner, a1, a0, true);
        path.closePath();

        const midA = (a0 + a1) / 2;
        const midR = (def.inner + def.outer) / 2;
        const poly = [];
        for (let i = 0; i <= 7; i++) {
          const a = a0 + (a1 - a0) * (i / 7);
          poly.push({ x: cx + Math.cos(a) * def.outer, y: cy + Math.sin(a) * def.outer });
        }
        for (let i = 7; i >= 0; i--) {
          const a = a0 + (a1 - a0) * (i / 7);
          poly.push({ x: cx + Math.cos(a) * def.inner, y: cy + Math.sin(a) * def.inner });
        }

        let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
        poly.forEach(pt => {
          if (pt.x < x0) x0 = pt.x;
          if (pt.y < y0) y0 = pt.y;
          if (pt.x > x1) x1 = pt.x;
          if (pt.y > y1) y1 = pt.y;
        });

        pieces.push({
          poly,
          path,
          outline: null,
          bbox: { x0, y0, x1, y1 },
          cx: cx + Math.cos(midA) * midR,
          cy: cy + Math.sin(midA) * midR,
          color: null,
          number: pieces.length + 1,
          ring: ringIndex,
          sector: s
        });
      }
    });

    return pieces;
  }

  function createPixelPieces(size = 16) {
    const pieces = [];
    const cell = 1 / size;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const x = c * cell;
        const y = r * cell;
        const path = new Path2D();
        path.rect(x, y, cell, cell);
        pieces.push({
          poly: [
            { x, y }, { x: x + cell, y },
            { x: x + cell, y: y + cell }, { x, y: y + cell }
          ],
          path,
          outline: null,
          bbox: { x0: x, y0: y, x1: x + cell, y1: y + cell },
          cx: x + cell / 2,
          cy: y + cell / 2,
          color: null,
          gridX: c,
          gridY: r
        });
      }
    }
    return pieces;
  }

  function buildPixelAdjacency(size = 16) {
    const adj = Array.from({ length: size * size }, () => []);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const i = r * size + c;
        if (c > 0) adj[i].push(i - 1);
        if (c < size - 1) adj[i].push(i + 1);
        if (r > 0) adj[i].push(i - size);
        if (r < size - 1) adj[i].push(i + size);
      }
    }
    return adj;
  }

  function pointInPolygon(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y;
      const xj = poly[j].x, yj = poly[j].y;
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  function clipPolygonByLine(poly, a, b, keepPositive) {
    const nx = -(b.y - a.y);
    const ny = b.x - a.x;
    const distance = p => nx * (p.x - a.x) + ny * (p.y - a.y);
    const out = [];

    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const dp = distance(p);
      const dq = distance(q);
      const insideP = keepPositive ? dp >= -1e-9 : dp <= 1e-9;
      const insideQ = keepPositive ? dq >= -1e-9 : dq <= 1e-9;

      if (insideP) out.push({ x: p.x, y: p.y });
      if (insideP !== insideQ) {
        const t = dp / (dp - dq);
        out.push({
          x: p.x + (q.x - p.x) * t,
          y: p.y + (q.y - p.y) * t
        });
      }
    }
    return cleanPolygon(out);
  }

  function linePolygonIntersections(poly, a, b) {
    const nx = -(b.y - a.y);
    const ny = b.x - a.x;
    const distance = p => nx * (p.x - a.x) + ny * (p.y - a.y);
    const hits = [];

    const addHit = p => {
      for (const hit of hits) {
        if (Math.hypot(hit.x - p.x, hit.y - p.y) < 1e-6) return;
      }
      hits.push({ x: p.x, y: p.y });
    };

    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const dp = distance(p);
      const dq = distance(q);

      if (Math.abs(dp) < 1e-8) addHit(p);
      if (Math.abs(dq) < 1e-8) addHit(q);
      if ((dp < -1e-8 && dq > 1e-8) || (dp > 1e-8 && dq < -1e-8)) {
        const t = dp / (dp - dq);
        addHit({
          x: p.x + (q.x - p.x) * t,
          y: p.y + (q.y - p.y) * t
        });
      }
    }

    if (hits.length !== 2) return null;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 < 1e-10) return null;
    hits.sort((p, q) => {
      const tp = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
      const tq = ((q.x - a.x) * dx + (q.y - a.y) * dy) / len2;
      return tp - tq;
    });
    return hits;
  }

  function makeStyledCutPoints(start, end, piece) {
    const style = state.cutStyle;
    const strength = state.cutStrength / 100;
    if (style === 'shard' || strength < 0.01) return [];

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.01) return [];

    const nx = -dy / len;
    const ny = dx / len;
    const mx = (start.x + end.x) / 2;
    const my = (start.y + end.y) / 2;
    const side = nx * (piece.cx - mx) + ny * (piece.cy - my) >= 0 ? 1 : -1;

    let amplitude = len * (style === 'round' ? 0.14 : style === 'curve' ? 0.22 : 0.14) * strength;

    for (let attempt = 0; attempt < 5; attempt++) {
      const points = [];

      if (style === 'curve' || style === 'round') {
        const ctrl = { x: mx + nx * amplitude * side, y: my + ny * amplitude * side };
        for (let s = 1; s < 12; s++) {
          const t = s / 12;
          const mt = 1 - t;
          points.push({
            x: mt * mt * start.x + 2 * mt * t * ctrl.x + t * t * end.x,
            y: mt * mt * start.y + 2 * mt * t * ctrl.y + t * t * end.y
          });
        }
      } else if (style === 'zigzag') {
        const ts = [0.2, 0.4, 0.6, 0.8];
        ts.forEach((t, i) => {
          const sign = i % 2 === 0 ? 1 : -1;
          points.push({
            x: start.x + dx * t + nx * amplitude * sign * side,
            y: start.y + dy * t + ny * amplitude * sign * side
          });
        });
      }

      const valid = points.every(p => hitCtx.isPointInPath(piece.path, p.x, p.y));
      if (valid) return points;
      amplitude *= 0.5;
    }
    return [];
  }

  function computeCutGeometry(piece, a, b) {
    if (!piece || !piece.outline) return null;
    const ends = linePolygonIntersections(piece.outline, a, b);
    if (!ends) return null;
    const [start, end] = ends;
    const styled = makeStyledCutPoints(start, end, piece);
    return {
      start,
      end,
      styled,
      path: [start, ...styled, end]
    };
  }

  function replaceCutEdge(poly, start, end, styled) {
    const n = poly.length;
    const close = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < 1e-5;

    for (let i = 0; i < n; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % n];
      let direction = 0;

      if (close(a, start) && close(b, end)) direction = 1;
      else if (close(a, end) && close(b, start)) direction = -1;
      if (!direction) continue;

      const out = [];
      for (let j = 0; j < n; j++) {
        out.push(poly[j]);
        if (j === i) {
          const points = direction === 1 ? styled : styled.slice().reverse();
          for (const pt of points) out.push(pt);
        }
      }
      return out;
    }
    return null;
  }

  function makeCustomPiece(poly, color) {
    const path = new Path2D();
    let x0 = 1, y0 = 1, x1 = 0, y1 = 0;

    poly.forEach((pt, i) => {
      if (i === 0) path.moveTo(pt.x, pt.y);
      else path.lineTo(pt.x, pt.y);
      if (pt.x < x0) x0 = pt.x;
      if (pt.y < y0) y0 = pt.y;
      if (pt.x > x1) x1 = pt.x;
      if (pt.y > y1) y1 = pt.y;
    });
    path.closePath();

    const geo = polygonAreaCentroid(poly);
    return {
      poly,
      path,
      outline: poly.map(p => ({ x: p.x, y: p.y })),
      bbox: { x0, y0, x1, y1 },
      cx: geo.cx,
      cy: geo.cy,
      color
    };
  }

  function extractImagePalette(sctx, size) {
    const data = sctx.getImageData(0, 0, size, size).data;
    const samples = [];
    for (let y = 6; y < size; y += 13) {
      for (let x = 6; x < size; x += 13) {
        const p = (y * size + x) * 4;
        if (data[p + 3] < 24) continue;
        samples.push([data[p], data[p + 1], data[p + 2]]);
      }
    }
    if (samples.length < 8) return PALETTES[0].colors.slice();

    const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    let first = samples[0];
    let firstSat = -1;
    samples.forEach(s => {
      const sat = Math.max(s[0], s[1], s[2]) - Math.min(s[0], s[1], s[2]);
      if (sat > firstSat) { firstSat = sat; first = s; }
    });

    const centers = [first.slice()];
    while (centers.length < 8) {
      let best = samples[0];
      let bestD = -1;
      samples.forEach(s => {
        let d = Infinity;
        centers.forEach(c => { d = Math.min(d, dist2(s, c)); });
        if (d > bestD) { bestD = d; best = s; }
      });
      centers.push(best.slice());
    }

    for (let iter = 0; iter < 7; iter++) {
      const sums = centers.map(() => [0, 0, 0, 0]);
      samples.forEach(s => {
        let bi = 0;
        let bd = Infinity;
        centers.forEach((c, i) => {
          const d = dist2(s, c);
          if (d < bd) { bd = d; bi = i; }
        });
        sums[bi][0] += s[0];
        sums[bi][1] += s[1];
        sums[bi][2] += s[2];
        sums[bi][3]++;
      });
      sums.forEach((sum, i) => {
        if (sum[3]) centers[i] = [sum[0] / sum[3], sum[1] / sum[3], sum[2] / sum[3]];
      });
    }

    const toHex = c => `#${c.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')}`;
    let colors = [];
    centers.forEach(c => {
      const hex = toHex(c);
      if (!colors.includes(hex)) colors.push(hex);
    });

    while (colors.length < 8) {
      const base = colors[colors.length % Math.max(1, colors.length)] || '#8A8174';
      const variant = mixHex(base, colors.length % 2 ? '#FFFDF5' : '#2C2721', 0.14 + colors.length * 0.03);
      if (!colors.includes(variant)) colors.push(variant);
      else colors.push(mixHex(base, '#FFFFFF', 0.06));
    }

    return colors
      .slice(0, 8)
      .sort((a, b) => oklabLightness(b) - oklabLightness(a));
  }

  function createImagePieces(source, colors, detail) {
    const N = 160, total = N * N;
    const rgba = source.data;
    let labels = new Uint8Array(total);
    for (let i = 0; i < total; i++) {
      const hex = '#' + [rgba[i*4], rgba[i*4+1], rgba[i*4+2]].map(v => v.toString(16).padStart(2,'0')).join('');
      labels[i] = nearestColorIndex(hex, colors);
    }
    // A small majority filter removes photographic speckle without blurring silhouettes.
    for (let pass = 0; pass < 2; pass++) {
      const next = labels.slice();
      for (let y=1;y<N-1;y++) for(let x=1;x<N-1;x++) {
        const votes = new Uint8Array(8), i=y*N+x;
        for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) votes[labels[i+dy*N+dx]]++;
        let best=labels[i]; for(let k=0;k<8;k++) if(votes[k]>votes[best]) best=k;
        if(votes[best]>=5) next[i]=best;
      }
      labels=next;
    }
    const owner = new Int32Array(total).fill(-1), regions=[];
    const neighbors = i => { const a=[]; if(i%N) a.push(i-1); if(i%N<N-1) a.push(i+1); if(i>=N) a.push(i-N); if(i<total-N) a.push(i+N); return a; };
    for(let i=0;i<total;i++) {
      if(owner[i]>=0) continue;
      const id=regions.length, pixels=[i]; owner[i]=id;
      for(let head=0;head<pixels.length;head++) for(const nb of neighbors(pixels[head])) {
        if(owner[nb]<0 && labels[nb]===labels[i]) {owner[nb]=id; pixels.push(nb);}
      }
      regions.push({pixels, tone:labels[i]});
    }
    const budget=Math.max(48, Math.min(480, detail*4));
    let count=regions.length;
    while(true) {
      let id=-1;
      for(let i=0;i<regions.length;i++) if(regions[i].pixels.length && (id<0 || regions[i].pixels.length<regions[id].pixels.length)) id=i;
      if(id<0 || (count<=budget && regions[id].pixels.length>=7)) break;
      const region=regions[id], contact=new Map();
      for(const px of region.pixels) for(const nb of neighbors(px)) if(owner[nb]!==id) contact.set(owner[nb], (contact.get(owner[nb])||0)+1);
      let into=-1, score=Infinity;
      for(const [nb,length] of contact) {
        const d=colorDistance(colors[region.tone],colors[regions[nb].tone]) / Math.sqrt(length);
        if(d<score) {score=d; into=nb;}
      }
      if(into<0) break;
      for(const px of region.pixels) {owner[px]=into; regions[into].pixels.push(px);}
      region.pixels=[]; count--;
    }
    // Intersect the subject regions with an irregular glass mesh. Flood each intersection
    // separately so every shard remains connected and keeps its original colour boundary.
    const seeds=sampleSeeds(Math.max(12, Math.min(120,detail)));
    const mesh=new Int32Array(total), oldOwner=owner.slice();
    for(let i=0;i<total;i++) {
      const x=(i%N+.5)/N,y=(Math.floor(i/N)+.5)/N;
      let best=0,dist=Infinity;
      seeds.forEach((p,j)=> {const d=(p.x-x)**2+(p.y-y)**2;if(d<dist){dist=d;best=j;}});
      mesh[i]=best;
    }
    const previous=regions.slice();regions.length=0;owner.fill(-1);
    for(let i=0;i<total;i++) {
      if(owner[i]>=0) continue;
      const id=regions.length,pixels=[i];owner[i]=id;
      for(let head=0;head<pixels.length;head++) for(const nb of neighbors(pixels[head])) {
        if(owner[nb]<0 && oldOwner[nb]===oldOwner[i] && mesh[nb]===mesh[i]) {owner[nb]=id;pixels.push(nb);}
      }
      regions.push({pixels,tone:previous[oldOwner[i]].tone});
    }
    // Remove slivers caused by a mesh edge grazing a silhouette, without crossing colours.
    regions.forEach((r,id)=> {
      if(r.pixels.length>=5 || !r.pixels.length) return;
      const nb=r.pixels.flatMap(neighbors).map(px=>owner[px]).find(nb=>nb!==id && regions[nb].tone===r.tone);
      if(nb===undefined) return;
      r.pixels.forEach(px=>{owner[px]=nb;regions[nb].pixels.push(px);});r.pixels=[];
    });
    // Simplify shared boundary chains with identical endpoints and deterministic ties.
    // This removes the raster staircase without opening cracks between neighbouring shards.
    const junctions=new Set();
    for(let y=0;y<=N;y++) for(let x=0;x<=N;x++) {
      const ids=new Set();
      for(const [dx,dy] of [[-1,-1],[0,-1],[-1,0],[0,0]]) {
        const xx=x+dx,yy=y+dy;ids.add(xx<0||yy<0||xx>=N||yy>=N?-1:owner[yy*N+xx]);
      }
      if(ids.size>=3 || ((x===0||x===N)&&(y===0||y===N))) junctions.add(y*(N+1)+x);
    }
    let contourTolerance=.007;
    const simplify=points=> {
      if(points.length<3) return points;
      const a=points[0],b=points[points.length-1],dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
      let best=-1,max=contourTolerance*contourTolerance;
      for(let i=1;i<points.length-1;i++) {
        const p=points[i],t=den?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/den)):0;
        const d=(p.x-a.x-t*dx)**2+(p.y-a.y-t*dy)**2;
        if(d>max+1e-14 || (best>=0 && Math.abs(d-max)<1e-14 && p.y*2+p.x<points[best].y*2+points[best].x)) {max=d;best=i;}
      }
      return best<0?[a,b]:[...simplify(points.slice(0,best+1)).slice(0,-1),...simplify(points.slice(best))];
    };
    const smoothLoop=loop=> {
      const anchors=[];
      loop.forEach((p,i)=>{if(junctions.has(Math.round(p.y*N)*(N+1)+Math.round(p.x*N))) anchors.push(i);});
      if(anchors.length<2) {
        if(!anchors.length) anchors.push(0);
        const a=loop[anchors[0]];let far=0;
        loop.forEach((p,i)=>{if((p.x-a.x)**2+(p.y-a.y)**2>(loop[far].x-a.x)**2+(loop[far].y-a.y)**2) far=i;});
        anchors.push(far);anchors.sort((a,b)=>a-b);
      }
      const out=[];
      anchors.forEach((start,i)=> {
        const end=anchors[(i+1)%anchors.length],chain=[loop[start]];
        for(let j=(start+1)%loop.length;j!==end;j=(j+1)%loop.length) chain.push(loop[j]);
        chain.push(loop[end]);out.push(...simplify(chain).slice(0,-1));
      });
      return out.length>=3?out:loop;
    };
    const pieces=[], remap=new Map();
    regions.forEach((r,id)=> {
      if(!r.pixels.length) return;
      const edges=new Map(), key=(x,y)=>y*(N+1)+x;
      const edge=(x,y,u,v)=> {const k=key(x,y); if(!edges.has(k)) edges.set(k,[]); edges.get(k).push(key(u,v));};
      let cx=0,cy=0,x0=N,y0=N,x1=0,y1=0;
      for(const px of r.pixels) {
        const x=px%N,y=Math.floor(px/N); cx+=x+.5;cy+=y+.5;
        x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);
        if(y===0 || owner[px-N]!==id) edge(x,y,x+1,y);
        if(x===N-1 || owner[px+1]!==id) edge(x+1,y,x+1,y+1);
        if(y===N-1 || owner[px+N]!==id) edge(x+1,y+1,x,y+1);
        if(x===0 || owner[px-1]!==id) edge(x,y+1,x,y);
      }
      const loops=[];
      while(edges.size) {
        const start=edges.keys().next().value, loop=[];let at=start;
        do {
          loop.push({x:(at%(N+1))/N,y:Math.floor(at/(N+1))/N});
          const exits=edges.get(at); if(!exits) break;
          const next=exits.pop(); if(!exits.length) edges.delete(at);at=next;
        } while(at!==start);
        if(loop.length>=3) loops.push(loop.filter((p,i,a)=> {
          const prev=a[(i+a.length-1)%a.length],next=a[(i+1)%a.length];
          return junctions.has(Math.round(p.y*N)*(N+1)+Math.round(p.x*N)) || Math.abs((p.x-prev.x)*(next.y-p.y)-(p.y-prev.y)*(next.x-p.x))>1e-10;
        }));
      }
      const rawLoops=loops.map(loop=>loop.slice());
      for(let i=0;i<loops.length;i++) loops[i]=smoothLoop(loops[i]);
      const path=new Path2D();
      loops.forEach(loop=> {
        path.moveTo(loop[0].x,loop[0].y);
        loop.slice(1).forEach(p=>path.lineTo(p.x,p.y));
        path.closePath();
      });
      loops.sort((a,b)=>Math.abs(polygonAreaCentroid(b).area)-Math.abs(polygonAreaCentroid(a).area));
      remap.set(id,pieces.length);
      pieces.push({path,loops,rawLoops,poly:loops[0],outline:loops[0],bbox:{x0:x0/N,y0:y0/N,x1:x1/N,y1:y1/N},cx:cx/r.pixels.length/N,cy:cy/r.pixels.length/N,color:null,imageTone:r.tone});
    });
    // Check vector topology, not just a screenshot: close boundaries must never cross.
    const crosses=()=> {
      const unique=new Map();
      pieces.forEach(p=>p.loops.forEach(loop=>loop.forEach((a,i)=> {
        const b=loop[(i+1)%loop.length];unique.set(edgeKey(a,b),[a,b]);
      })));
      const edges=[...unique.values()];
      const side=(a,b,p)=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
      for(let i=0;i<edges.length;i++) for(let j=i+1;j<edges.length;j++) {
        const [a,b]=edges[i],[c,d]=edges[j];
        if(Math.max(a.x,b.x)<Math.min(c.x,d.x) || Math.max(c.x,d.x)<Math.min(a.x,b.x) || Math.max(a.y,b.y)<Math.min(c.y,d.y) || Math.max(c.y,d.y)<Math.min(a.y,b.y)) continue;
        if(side(a,b,c)*side(a,b,d)<-1e-16 && side(c,d,a)*side(c,d,b)<-1e-16) return true;
      }
      return false;
    };
    for(let attempt=0;attempt<4 && crosses();attempt++) {
      contourTolerance=attempt===3?0:contourTolerance*.5;
      pieces.forEach(p=> {
        p.loops=p.rawLoops.map(loop=>contourTolerance?smoothLoop(loop):loop);
        p.poly=p.outline=p.loops.reduce((a,b)=>Math.abs(polygonAreaCentroid(a).area)>Math.abs(polygonAreaCentroid(b).area)?a:b);
        p.path=new Path2D();p.loops.forEach(loop=>p.path.addPath(buildStraightPath(loop)));
      });
    }
    pieces.forEach(p=>delete p.rawLoops);
    const adjacency=pieces.map(()=>new Set());
    for(let i=0;i<total;i++) for(const nb of [i%N<N-1?i+1:-1,i<total-N?i+N:-1]) {
      if(nb<0 || owner[i]===owner[nb]) continue;
      const a=remap.get(owner[i]),b=remap.get(owner[nb]);adjacency[a].add(b);adjacency[b].add(a);
    }
    return {pieces,adjacency:adjacency.map(a=>[...a])};
  }
PALETTES.forEach(p=>p.colors.sort((a,b)=>oklabLightness(b)-oklabLightness(a)));
function trace(ctx,path) {ctx.beginPath();path.commands.forEach(([method,args])=>ctx[method](...args));}
function make(mode,count,style,strength) {
 state.cutStyle=style||'shard';state.cutStrength=strength===undefined?50:strength;
 const pieces=mode==='line'?createMandalaPieces():mode==='pixel'?createPixelPieces():createPieces(count);
 const adjacency=mode==='pixel'?buildPixelAdjacency():mode==='line'?buildNearestAdjacency(pieces):buildAdjacency(pieces);
 return {pieces,adjacency};
}
function pick(pieces,x,y) {
 for(let i=pieces.length-1;i>=0;i--) {
  const p=pieces[i],box=p.bbox;if(x<box.x0||x>box.x1||y<box.y0||y>box.y1)continue;
  if(p.loops) {let inside=false;p.loops.forEach(loop=>{if(pointInPolygon(x,y,loop))inside=!inside;});if(inside)return i;}
  else if(pointInPolygon(x,y,p.outline||p.poly)) return i;
 }
 return -1;
}
function split(pieces,index,a,b,style,strength) {
 const p=pieces[index];if(!p || !p.outline || Math.hypot(a.x-b.x,a.y-b.y)<.01)return null;
 state.cutStyle=style;state.cutStrength=strength;
 let loopsA=(p.loops||[p.outline]).map(loop=>clipPolygonByLine(loop,a,b,true)).filter(loop=>loop.length>=3);
 let loopsB=(p.loops||[p.outline]).map(loop=>clipPolygonByLine(loop,a,b,false)).filter(loop=>loop.length>=3);
 if(!loopsA.length||!loopsB.length)return null;
 // Styled cuts are safe for a single simple loop. Multi-loop image regions retain holes.
 if(!p.loops) {
  const geo=computeCutGeometry(p,a,b);
  if(geo) {loopsA[0]=replaceCutEdge(loopsA[0],geo.start,geo.end,geo.styled)||loopsA[0];loopsB[0]=replaceCutEdge(loopsB[0],geo.start,geo.end,geo.styled)||loopsB[0];}
 }
 const build=loops=>{
  if(Math.abs(loops.reduce((sum,loop)=>sum+polygonAreaCentroid(loop).area,0))<.00025)return null;
  loops.sort((a,b)=>Math.abs(polygonAreaCentroid(b).area)-Math.abs(polygonAreaCentroid(a).area));
  const out=makeCustomPiece(loops[0],p.color);out.loops=loops;out.path=new Path2D();
  loops.forEach(loop=>out.path.addPath(buildStraightPath(loop)));out.imageTone=p.imageTone;
  return out;
 };
 const first=build(loopsA),second=build(loopsB);return first&&second?[first,second]:null;
}
function sharedHinge(piece,from) {
 let fallback=null,min=Infinity,shared=null,longest=0;
 const poly=piece.outline||piece.poly,other=from.outline||from.poly;
 for(let i=0;i<poly.length;i++) {
  const a=poly[i],b=poly[(i+1)%poly.length],distance=Math.hypot((a.x+b.x)/2-from.cx,(a.y+b.y)/2-from.cy);
  if(distance<min){min=distance;fallback={a,b};}
  for(let j=0;j<other.length;j++) {
   const c=other[j],d=other[(j+1)%other.length],dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;
   if(len<1e-12||Math.abs(dx*(c.y-a.y)-dy*(c.x-a.x))>1e-7||Math.abs(dx*(d.y-a.y)-dy*(d.x-a.x))>1e-7)continue;
   const t=((c.x-a.x)*dx+(c.y-a.y)*dy)/len,u=((d.x-a.x)*dx+(d.y-a.y)*dy)/len;
   const lo=Math.max(0,Math.min(t,u)),hi=Math.min(1,Math.max(t,u)),length=(hi-lo)*Math.sqrt(len);
   if(length>longest){longest=length;shared={a:{x:a.x+lo*dx,y:a.y+lo*dy},b:{x:a.x+hi*dx,y:a.y+hi*dy}};}
  }
 }
 return shared||fallback;
}
function spreadPlan(pieces,adjacency,seed) {
 const dist=pieces.map(()=>Infinity),parent=pieces.map(()=>-1),queue=[seed];dist[seed]=0;
 for(let head=0;head<queue.length;head++)for(const nb of adjacency[queue[head]]||[]) {
  if(dist[nb]!==Infinity)continue;dist[nb]=dist[queue[head]]+1;parent[nb]=queue[head];queue.push(nb);
 }
 const max=Math.max(1,...dist.filter(Number.isFinite));
 return pieces.map((p,i)=>({delay:Number.isFinite(dist[i])?dist[i]/max*920:1000,hinge:parent[i]<0?null:sharedHinge(p,pieces[parent[i]])}));
}
module.exports={PALETTES,Path2D,trace,make,pick,split,spreadPlan,createImagePieces,extractImagePalette,buildAdjacency,buildNearestAdjacency,oklabLightness,hexToRgb,hexToRgba,mixHex,clamp};
