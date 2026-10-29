import {describe,it,expect,vi,beforeEach} from 'vitest';
const mock=vi.hoisted(()=>({getUser:vi.fn(),from:vi.fn()}));
vi.mock('../../../src/lib/supabase',()=>({supabase:{auth:{getUser:mock.getUser},from:mock.from}}));
import {getMapMatrix,getMapMetrics,saveMap,getMyMaps,getMapById} from '../../../src/services/mapsStorage';
beforeEach(()=>{mock.getUser.mockReset();mock.from.mockReset();mock.getUser.mockResolvedValue({data:{user:{id:'user-1'}},error:null});});
describe('Persistencia y consulta de mapas (Supabase simulado)',()=>{
 it('extrae matriz y métricas de respuestas alternativas',()=>{expect(getMapMatrix({result:{matrix:[[0,1]]}})).toEqual([[0,1]]);expect(getMapMetrics({evaluation:{score:5}})).toEqual({score:5});});
 it('rechaza guardar sin mapa',async()=>{await expect(saveMap({})).rejects.toThrow('Primero debes generar');});
 it('rechaza guardar sin sesión',async()=>{mock.getUser.mockResolvedValue({data:{user:null},error:null});await expect(saveMap({generatedMap:{matrix:[[0]]}})).rejects.toThrow('No existe una sesión activa');});
 it('guarda mapa y normaliza complejidad',async()=>{const single=vi.fn().mockResolvedValue({data:{id:'map-1'},error:null});const select=vi.fn(()=>({single}));const insert=vi.fn(()=>({select}));mock.from.mockReturnValue({insert});const result=await saveMap({mapType:'bosque',algorithm:'perlin',width:2,height:1,seed:3,complexity:'Alto',tileSize:16,generatedMap:{matrix:[[0,1]],metrics:{score:1}}});expect(result.id).toBe('map-1');expect(insert).toHaveBeenCalledWith(expect.objectContaining({user_id:'user-1',complexity:'high',matrix:[[0,1]]}));});
 it('consulta lista ordenada',async()=>{const order=vi.fn().mockResolvedValue({data:[{id:'map-1'}],error:null});const select=vi.fn(()=>({order}));mock.from.mockReturnValue({select});await expect(getMyMaps()).resolves.toEqual([{id:'map-1'}]);expect(order).toHaveBeenCalledWith('created_at',{ascending:false});});
 it('valida identificador obligatorio',async()=>{await expect(getMapById('')).rejects.toThrow('El ID del mapa es obligatorio');});
 it('consulta mapa por identificador',async()=>{const single=vi.fn().mockResolvedValue({data:{id:'map-1'},error:null});const eq=vi.fn(()=>({single}));mock.from.mockReturnValue({select:()=>({eq})});await expect(getMapById('map-1')).resolves.toEqual({id:'map-1'});expect(eq).toHaveBeenCalledWith('id','map-1');});
});
