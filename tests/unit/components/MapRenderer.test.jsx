import React from 'react';
import {describe,it,expect,vi} from 'vitest';
import {render,screen} from '@testing-library/react';
vi.mock('../../../src/utils/mapTileResolver',()=>({resolveMapTile:vi.fn(()=>null)}));
import MapRenderer from '../../../src/components/MapRenderer';
describe('Renderizador de mapas',()=>{
 it('muestra aviso sin mapa',()=>{render(<MapRenderer map={null}/>);expect(screen.getByText('No hay mapa disponible.')).toBeInTheDocument()});
 it('rechaza matrices irregulares',()=>{render(<MapRenderer map={[[0,1],[1]]}/>);expect(screen.getByText('La matriz del mapa no es válida.')).toBeInTheDocument()});
 it('rechaza celdas fuera de 0 y 1',()=>{render(<MapRenderer map={[[0,2]]}/>);expect(screen.getByText('La matriz del mapa no es válida.')).toBeInTheDocument()});
 it('renderiza celdas con tamaño solicitado',()=>{const {container}=render(<MapRenderer map={[[0,1],[1,0]]} tileSize={16}/>);expect(container.querySelectorAll('[style*="width: 16px"]')).toHaveLength(4)});
});
