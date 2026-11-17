import {beforeEach, describe, expect, it, vi} from 'vitest';
import {generateV2Map} from '../../src/services/mapsApi';
import {apiRequest} from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
    apiRequest: vi.fn(),
}));

const payload = {
    terrain_type: 'bosque',
    width: 50,
    height: 35,
    seed: 539989,
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Integración frontend - generación de mapas V2 (API simulada)', () => {
    it('envía POST al endpoint V2 y devuelve el resultado', async () => {
        const response = {
            matrix: [[0, 1], [1, 0]],
            metrics: {accessibility: 0.5},
        };
        apiRequest.mockResolvedValue(response);

        await expect(generateV2Map(payload)).resolves.toEqual(response);
        expect(apiRequest).toHaveBeenCalledOnce();
        expect(apiRequest).toHaveBeenCalledWith(
            import.meta.env.VITE_API_V2_ENDPOINT || '/api/v2/maps/generate-adaptive',
            {method: 'POST', body: JSON.stringify(payload)},
        );
    });

    it('propaga errores del backend', async () => {
        apiRequest.mockRejectedValue(new Error('Parámetros inválidos'));
        await expect(generateV2Map(payload)).rejects.toThrow('Parámetros inválidos');
    });

    it('propaga errores de red', async () => {
        apiRequest.mockRejectedValue(new Error('Sin conexión'));
        await expect(generateV2Map(payload)).rejects.toThrow('Sin conexión');
    });
});
