import React from "react";
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GenerationError from '../../../src/components/GenerationError';
import GenerationStatus from '../../../src/components/GenerationStatus';
import MapLoader from '../../../src/components/MapLoader';
import MapLegend from '../../../src/components/MapLegend';
describe('Componentes visuales', () => {
 it('muestra el error de conexión y permite reintentar', () => { const retry=vi.fn();render(<GenerationError type="connection" message="Fallo de red" onRetry={retry}/>);expect(screen.getByRole('alert')).toHaveTextContent('Fallo de red');fireEvent.click(screen.getByRole('button',{name:/Reintentar generación/i}));expect(retry).toHaveBeenCalledOnce(); });
 it('deshabilita reintentar durante la petición', () => {render(<GenerationError retrying onRetry={()=>{}}/>);expect(screen.getByRole('button')).toBeDisabled();});
 it('no muestra estado sin mapa', () => {const {container}=render(<GenerationStatus/>);expect(container).toBeEmptyDOMElement();});
 it('indica configuración aplicada', () => {render(<GenerationStatus hasMap/>);expect(screen.getByRole('status')).toHaveTextContent('Configuración aplicada');});
 it('indica cambios pendientes', () => {render(<GenerationStatus hasMap hasChanges/>);expect(screen.getByRole('status')).toHaveTextContent('Tienes cambios pendientes');});
 it('muestra indicador de carga', () => {render(<MapLoader/>);expect(screen.getByRole('status')).toHaveTextContent('Generando tu mapa');});
 it('renderiza leyenda de bosque', () => {render(<MapLegend terrainType="bosque"/>);expect(document.body).toHaveTextContent('Terreno transitable');});
});
