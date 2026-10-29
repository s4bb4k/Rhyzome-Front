import React from 'react';
import {describe,it,expect} from 'vitest';
import {render,screen,within} from '@testing-library/react';
import MapLegend from '../../../src/components/MapLegend';

describe('Leyenda de mapas: escenarios y personalización',()=>{
  it.each(['bosque','desierto','ciudad','mazmorra'])(`presenta leyenda del terreno %s`,(terrainType)=>{
    render(<MapLegend terrainType={terrainType}/>);
    const legend=screen.getByRole('region',{name:'Leyenda del mapa'});
    expect(within(legend).getAllByText(/transitable|obstáculo|suelo|pared|estructura|terreno arenoso/i).length).toBeGreaterThan(0);
  });
  it('permite elementos personalizados',()=>{
    render(<MapLegend items={[{id:'custom',label:'Lava',description:'No transitable',color:'#ff0000'}]}/>);
    expect(screen.getByText('Lava')).toBeInTheDocument();
    expect(screen.getByText('1 tipos')).toBeInTheDocument();
  });
  it('no muestra una leyenda si los elementos están vacíos',()=>{
    const {container}=render(<MapLegend items={[]}/>);
    expect(container.querySelector('.map-legend')).toBeNull();
  });
  it('no muestra una leyenda para entradas desconocidas',()=>{
    const {container}=render(<MapLegend terrainType='desconocido' algorithm='desconocido'/>);
    expect(container.querySelector('.map-legend')).toBeNull();
  });
  it('usa leyenda de respaldo cuando no existe terreno válido',()=>{
    render(<MapLegend terrainType='desconocido' algorithm='perlin'/>);
    expect(screen.getByRole('region',{name:'Leyenda del mapa'})).toBeInTheDocument();
  });
});
