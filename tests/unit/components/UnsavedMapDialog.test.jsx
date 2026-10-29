import React from 'react';
import {describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import UnsavedMapDialog from '../../../src/components/UnsavedMapDialog';
describe('Confirmación de mapa no guardado',()=>{
 it('permanece oculto cuando open es falso',()=>{render(<UnsavedMapDialog/>);expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()});
 it('confirma la generación',()=>{const onConfirm=vi.fn();render(<UnsavedMapDialog open onConfirm={onConfirm}/>);fireEvent.click(screen.getByRole('button',{name:'Generar nuevo mapa'}));expect(onConfirm).toHaveBeenCalledOnce()});
 it('cancela al pulsar Escape',()=>{const onCancel=vi.fn();render(<UnsavedMapDialog open onCancel={onCancel}/>);fireEvent.keyDown(document,{key:'Escape'});expect(onCancel).toHaveBeenCalledOnce()});
 it('cancela desde el botón',()=>{const onCancel=vi.fn();render(<UnsavedMapDialog open onCancel={onCancel}/>);fireEvent.click(screen.getByRole('button',{name:'Cancelar'}));expect(onCancel).toHaveBeenCalledOnce()});
});
