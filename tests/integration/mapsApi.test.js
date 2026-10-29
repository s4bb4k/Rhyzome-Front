import {describe,it,expect,vi,beforeEach} from 'vitest';
import {generateAdaptiveMap} from '../../src/services/mapsApi';
beforeEach(()=>vi.stubGlobal('fetch',vi.fn()));
const payload={terrain_type:'bosque',algorithm:'perlin',width:50,height:35,seed:539989,complexity:'high',tile_size:16,probability:0.45,iterations:4,attempts:10};
describe('Integración frontend - generación de mapas (HTTP simulado)',()=>{
 it('envía POST y devuelve la matriz',async()=>{const response={matrix:[[0,1],[1,0]],metrics:{score:0.8}};fetch.mockResolvedValue({ok:true,json:async()=>response});await expect(generateAdaptiveMap(payload)).resolves.toEqual(response);expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/maps/generate-adaptive'),expect.objectContaining({method:'POST',body:JSON.stringify(payload)}));});
 it('propaga errores del backend',async()=>{fetch.mockResolvedValue({ok:false,status:400,json:async()=>({message:'Parámetros inválidos'})});await expect(generateAdaptiveMap(payload)).rejects.toThrow('Parámetros inválidos');});
 it('propaga errores de red',async()=>{fetch.mockRejectedValue(new Error('Sin conexión'));await expect(generateAdaptiveMap(payload)).rejects.toThrow('Sin conexión');});
});
