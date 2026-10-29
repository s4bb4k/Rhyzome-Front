import React from 'react';
import {describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import MapHistory from '../../../src/components/MapHistory';
const maps=[{id:'a',config:{mapType:'bosque',seed:10,width:10,height:10},quality:90,isSaved:true},{id:'b',config:{mapType:'mazmorra',seed:20,width:20,height:10},quality:80,isSaved:false}];
describe('Historial temporal',()=>{
 it('no aparece sin mapas',()=>{const {container}=render(<MapHistory/>);expect(container).toBeEmptyDOMElement()});
 it('abre y cierra historial',()=>{render(<MapHistory maps={maps}/>);fireEvent.click(screen.getByText('Historial 2/5'));expect(screen.getByRole('region',{name:'Historial de generación'})).toBeInTheDocument();fireEvent.keyDown(document,{key:'Escape'});expect(screen.queryByRole('region',{name:'Historial de generación'})).not.toBeInTheDocument()});
 it('selecciona un mapa anterior',()=>{const onSelect=vi.fn();render(<MapHistory maps={maps} activeMapId='a' onSelect={onSelect}/>);fireEvent.click(screen.getByText('Historial 2/5'));fireEvent.click(screen.getByTitle('Recuperar este mapa'));expect(onSelect).toHaveBeenCalledWith('b')});
 it('elimina una entrada del historial',()=>{const onDelete=vi.fn();render(<MapHistory maps={maps} onDelete={onDelete}/>);fireEvent.click(screen.getByText('Historial 2/5'));fireEvent.click(screen.getByLabelText('Quitar bosque, semilla 10, del historial'));expect(onDelete).toHaveBeenCalledWith('a')});
});
