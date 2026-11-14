import grass from '../assets/kenney/terrain/grass.png';
import sand from '../assets/kenney/terrain/sand.png';
import dirt from '../assets/kenney/terrain/dirt.png';
import stone from '../assets/kenney/terrain/stone.png';
import water from '../assets/kenney/terrain/water.png';
import tree from '../assets/kenney/terrain/tree.png';
import bush from '../assets/kenney/terrain/bush.png';
import rock from '../assets/kenney/terrain/stone.png';
import road from '../assets/kenney/city/road.png';
import building from '../assets/kenney/city/building.png';
import wall from '../assets/kenney/dungeon/wall.png';
import floor from '../assets/kenney/dungeon/floor.png';
import fire from '../assets/kenney/dungeon/fire.png';

// Catálogos semánticos: si el backend devuelve nombres, se usan directamente.
// Los ID son los documentados para el experimento V2; el catálogo de la respuesta
// tiene prioridad sobre cualquier correspondencia local.
const terrainNames = {0:'grass',1:'water',2:'sand',3:'dirt',4:'stone',5:'road',6:'plaza'};
const objectNames = {0:'empty',1:'tree',2:'rock',3:'cactus',4:'building',5:'wall',6:'door',7:'decoration'};
const sprites = {grass, sand, dirt, stone, water, tree, rock, road, building, wall, floor, bush, decoration:bush, plaza:stone, door:dirt, cactus:bush};
const colors = {grass:'#80b84e', sand:'#ead5a5', dirt:'#ae8858', stone:'#858b91', water:'#4b9cc8', road:'#8a9ba5', plaza:'#b8b6aa', wall:'#555b65', building:'#b98955', tree:'#247746', rock:'#7f8990', cactus:'#38864d', door:'#9d704a', decoration:'#6e9d4c', empty:'transparent'};
function lookup(catalog, id, fallback) {
  const item = catalog?.[id] ?? catalog?.[String(id)];
  const reversed = catalog && Object.entries(catalog).find(([,value]) => Number(value) === Number(id));
  const raw = typeof item === 'string' ? item : item?.name ?? item?.label ?? item?.type ?? reversed?.[0] ?? fallback[id];
  return String(raw ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll(' ','_');
}
function canonical(name) {
  const value = String(name).toLowerCase();
  const aliases = {cesped:'grass', hierba:'grass', suelo:'floor', arena:'sand', agua:'water', camino:'dirt', calle:'road', piedra:'stone', roca:'rock', arbol:'tree', edificio:'building', muro:'wall', pared:'wall', puerta:'door', decoracion:'decoration', vacio:'empty'};
  return aliases[value] || value;
}
export default function MapRendererV2({response, tileSize=16, terrainType='Bosque', fit=false}) {
  const layers = response?.layers ?? response?.map?.layers ?? {};
  const terrain = layers.terrain;
  const objects = layers.objects;
  const collisions = layers.collision;
  if (!Array.isArray(terrain) || !terrain.length || !Array.isArray(terrain[0])) return <p>No se recibieron capas semánticas V2 válidas.</p>;
  const width = terrain[0].length;
  const valid = terrain.every(row => Array.isArray(row) && row.length === width) && [objects,collisions].every(layer => !layer || (Array.isArray(layer) && layer.length === terrain.length && layer.every(row => Array.isArray(row) && row.length === width)));
  if (!valid) return <p>Las capas semánticas tienen dimensiones inconsistentes.</p>;
  const terrainCatalog = response.terrain_catalog ?? response.catalogs?.terrain;
  const objectCatalog = response.object_catalog ?? response.catalogs?.objects;
  const size = Math.max(8,Number(tileSize)||16);
  return <div style={{overflow:fit?'hidden':'auto',maxWidth:'100%',width:'100%',padding:fit?0:12,background:'#101820',borderRadius:8}}>
    <div style={{display:'grid',gridTemplateColumns:fit?`repeat(${width}, minmax(0, 1fr))`:`repeat(${width}, ${size}px)`,width:fit?'100%':'max-content',margin:'auto'}}>
      {terrain.flatMap((row,y)=>row.map((cell,x)=>{
        let ground = canonical(lookup(terrainCatalog,cell,terrainNames));
        let object = canonical(lookup(objectCatalog,objects?.[y]?.[x] ?? 0,objectNames));
        if (String(terrainType).toLowerCase()==='mazmorra' && ground==='stone') ground='floor';
        const base = sprites[ground] || stone;
        const overlay = object==='empty' ? null : (sprites[object] || (object==='cactus'?bush:null));
        return <div key={`${x}-${y}`} title={`${ground} · ${object}`} style={{width:fit?'100%':size,height:fit?'auto':size,aspectRatio:fit?'1 / 1':undefined,position:'relative',backgroundColor:colors[ground]||'#596875',backgroundImage:`url(${base})`,backgroundSize:'100% 100%',imageRendering:'pixelated'}}>
          {overlay && <img src={overlay} alt="" draggable={false} style={{position:'absolute',inset:0,width:'100%',height:'100%',imageRendering:'pixelated',pointerEvents:'none'}}/>}
        </div>;
      }))}
    </div>
  </div>;
}

// Exporta la misma composición semántica mostrada en el visor V2.
export async function exportV2Canvas(response, pixelSize=16) {
  const layers=response?.layers;
  if(!layers?.terrain?.length) throw new Error('No hay capas V2 para exportar');
  const terrain=layers.terrain,objects=layers.objects;
  const canvas=document.createElement('canvas');
  canvas.width=terrain[0].length*pixelSize;canvas.height=terrain.length*pixelSize;
  const ctx=canvas.getContext('2d');
  if(!ctx) throw new Error('Canvas no disponible');
  ctx.imageSmoothingEnabled=false;
  const tCatalog=response.terrain_catalog ?? response.catalogs?.terrain;
  const oCatalog=response.object_catalog ?? response.catalogs?.objects;
  const names=new Set();
  const cells=terrain.flatMap((row,y)=>row.map((cell,x)=>{
    let ground=canonical(lookup(tCatalog,cell,terrainNames));
    if(response.terrain_type==='mazmorra' && ground==='stone')ground='floor';
    const object=canonical(lookup(oCatalog,objects?.[y]?.[x]??0,objectNames));
    if(sprites[ground])names.add(ground);
    if(sprites[object])names.add(object);
    return {x,y,ground,object};
  }));
  const loaded=new Map(await Promise.all([...names].map(name=>new Promise(resolve=>{
    const img=new window.Image();img.onload=()=>resolve([name,img]);img.onerror=()=>resolve([name,null]);img.src=sprites[name];
  }))));
  for(const {x,y,ground,object} of cells){
    const px=x*pixelSize,py=y*pixelSize;
    ctx.fillStyle=colors[ground]||'#596875';ctx.fillRect(px,py,pixelSize,pixelSize);
    const base=loaded.get(ground);if(base)ctx.drawImage(base,px,py,pixelSize,pixelSize);
    if(object!=='empty'){const overlay=loaded.get(object);if(overlay)ctx.drawImage(overlay,px,py,pixelSize,pixelSize)}
  }
  return canvas;
}
