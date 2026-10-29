import { describe, it, expect } from "vitest";

describe("Rhyzome - Entorno de pruebas", () => {

    it("debe ejecutar correctamente una prueba básica", () => {

        const resultado = 2 + 2;

        expect(resultado).toBe(4);

    });

    it("debe disponer de un entorno DOM", () => {

        const elemento = document.createElement("div");

        elemento.textContent = "Rhyzome";

        expect(elemento.textContent).toBe("Rhyzome");

    });

});