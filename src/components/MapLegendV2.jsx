import grass from '../assets/kenney/terrain/grass.png';
import sand from '../assets/kenney/terrain/sand.png';
import dirt from '../assets/kenney/terrain/dirt.png';
import stone from '../assets/kenney/terrain/stone.png';
import water from '../assets/kenney/terrain/water.png';
import tree from '../assets/kenney/terrain/tree.png';
import bush from '../assets/kenney/terrain/bush.png';
import road from '../assets/kenney/city/road.png';
import building from '../assets/kenney/city/building.png';
import wall from '../assets/kenney/dungeon/wall.png';
import floor from '../assets/kenney/dungeon/floor.png';
import fire from '../assets/kenney/dungeon/fire.png';

const defaults = {
 terrain: {0: 'Césped', 1: 'Agua', 2: 'Arena', 3: 'Camino', 4: 'Piedra', 5: 'Calle', 6: 'Plaza'},
 objects: {1: 'Árbol', 2: 'Roca', 3: 'Cactus', 4: 'Edificio', 5: 'Muro', 6: 'Puerta', 7: 'Decoración'}
};
const terrainSprites = {0: grass, 1: water, 2: sand, 3: dirt, 4: stone, 5: road, 6: stone};
const objectSprites = {1: tree, 2: stone, 3: bush, 4: building, 5: wall, 6: dirt, 7: bush};
const names = {
 cesped: grass,
 grass,
 agua: water,
 water,
 arena: sand,
 sand,
 camino: dirt,
 dirt,
 calle: road,
 road,
 piedra: stone,
 stone,
 plaza: stone,
 arbol: tree,
 tree,
 roca: stone,
 rock: stone,
 cactus: bush,
 edificio: building,
 building,
 muro: wall,
 wall,
 puerta: dirt,
 door: dirt,
 decoracion: bush,
 decoration: bush
};
export default function MapLegendV2({response}) {
 const dungeon = String(response?.terrain_type ?? '').toLowerCase() === 'mazmorra';
 const layers = response?.layers ?? response?.map?.layers ?? {};
 const catalogs = {
  terrain: response?.terrain_catalog ?? response?.catalogs?.terrain,
  objects: response?.object_catalog ?? response?.catalogs?.objects
 };
 const entries = ['terrain', 'objects'].flatMap(layer => {
  const matrix = layers[layer];
  if (!Array.isArray(matrix)) return [];
  return [...new Set(matrix.flat())].filter(id => layer === 'terrain' || Number(id) !== 0).map(id => {
   const item = catalogs[layer]?.[id];
   const reversed = Object.entries(catalogs[layer] ?? {}).find(([, v]) => Number(v) === Number(id));
   const label = typeof item === 'string' ? item : item?.name ?? item?.label ?? reversed?.[0] ?? defaults[layer][id] ?? `${layer} ${id}`;
   const key = String(label).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(' ', '_');
   const sprite = names[key] ?? (layer === 'terrain' ? terrainSprites[id] : objectSprites[id]);
   let displayLabel = label;
   let displaySprite = sprite;
   if (dungeon) {
    if (layer === 'terrain' && ['stone', 'piedra', 'plaza', 'road', 'calle', 'dirt', 'camino', 'grass', 'cesped'].includes(key)) {
     displayLabel = 'Suelo de piedra transitable';
     displaySprite = floor;
    }
    if (layer === 'objects' && ['decoration', 'decoracion', 'tree', 'arbol', 'cactus', 'building', 'edificio'].includes(key)) {
     displayLabel = 'Antorcha';
     displaySprite = fire;
    }
   }
   return {
    id: `${layer}-${id}`,
    label: displayLabel,
    group: layer === 'terrain' ? 'Terreno' : 'Objeto',
    sprite: displaySprite,
    wall: dungeon && layer === 'objects' && ['wall', 'muro', 'pared'].includes(key)
   };
  });
 });
 return <section className="rh-legend">
  <header><strong>Leyenda del mapa (V2)</strong><span>{entries.length} elementos</span></header>
  <div className="rh-legend-grid">{entries.map(item => <div key={item.id}
                                                            className="rh-legend-item rh-legend-visual">{item.sprite ?
      <img src={item.sprite} alt=""
           style={item.wall ? {filter: "brightness(0.38) contrast(1.25)"} : undefined}/> :
      <span className="rh-legend-placeholder">?</span>}
   <div><strong>{item.label}</strong><small>{item.group}</small></div>
  </div>)}</div>
 </section>;
}
