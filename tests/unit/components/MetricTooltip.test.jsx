import React from 'react';
import {describe,it,expect} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import MetricTooltip from '../../../src/components/MetricTooltip';
describe('Ayuda contextual de métricas',()=>{
 it('muestra descripción al pulsar información',()=>{render(<MetricTooltip title='Calidad' description='Valor de calidad del mapa'/>);const button=screen.getByRole('button',{name:'Información sobre Calidad'});expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();fireEvent.click(button);expect(screen.getByRole('tooltip')).toHaveTextContent('Valor de calidad del mapa')});
 it('se cierra con Escape',()=>{render(<MetricTooltip title='Calidad' description='Detalle'/>);fireEvent.click(screen.getByRole('button',{name:'Información sobre Calidad'}));fireEvent.keyDown(document,{key:'Escape'});expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()});
});
