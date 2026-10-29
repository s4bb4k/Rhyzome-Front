import { describe, it, expect, vi } from "vitest";

import { render, screen } from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import TestButton from "../../src/components/TestButton";

describe("Rhyzome - Pruebas de componentes", () => {

    // Prueba 1
    it("debe renderizar correctamente el botón", () => {

        render(
            <TestButton text="Generar mapa" />
        );

        const button = screen.getByRole("button", {
            name: "Generar mapa",
        });

        expect(button).toBeInTheDocument();

    });

    // Prueba 2
    it("debe mostrar el texto recibido", () => {

        render(
            <TestButton text="Guardar mapa" />
        );

        expect(
            screen.getByText("Guardar mapa")
        ).toBeInTheDocument();

    });

    // Prueba 3
    it("debe ejecutar la función al hacer clic", async () => {

        const user = userEvent.setup();

        const handleClick = vi.fn();

        render(
            <TestButton
                text="Generar mapa"
                onClick={handleClick}
            />
        );

        await user.click(
            screen.getByRole("button", {
                name: "Generar mapa",
            })
        );

        expect(handleClick).toHaveBeenCalledTimes(1);

    });

    // Prueba 4
    it("debe permitir deshabilitar el botón", () => {

        render(
            <TestButton
                text="Generar mapa"
                disabled={true}
            />
        );

        const button = screen.getByRole("button", {
            name: "Generar mapa",
        });

        expect(button).toBeDisabled();

    });

});