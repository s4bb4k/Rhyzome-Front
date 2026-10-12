const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;



if (!API_BASE_URL) {
    throw new Error(
        "Falta configurar VITE_API_BASE_URL para este ambiente"
    );
}

export async function apiRequest(endpoint, options = {}) {
    try {

      console.log("=== DIAGNÓSTICO RHYZOME ===");
      console.log("Ambiente:", import.meta.env.MODE);
      console.log("URL configurada:", API_BASE_URL);
      console.log("Endpoint:", endpoint);
      console.log("URL completa:", `${API_BASE_URL}${endpoint}`);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(
                data?.message ||
                data?.error ||
                `Error HTTP ${response.status}`
            );
        }

        return data;

    } catch (error) {
        console.error("Error al consumir la API:", error);
        throw error;
    }
}
