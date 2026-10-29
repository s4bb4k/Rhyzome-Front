import React from "react";

import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterEach,
} from "vitest";

import {
  render,
  screen,
  fireEvent,
  act,
} from "@testing-library/react";

import MapViewer from "../../../src/components/MapViewer";

/* =====================================================
   CONFIGURACIÓN DEL ENTORNO DE PRUEBAS
   ===================================================== */

beforeAll(() => {

  // jsdom puede no implementar PointerEvent completamente.
  // Se proporciona una implementación compatible con MouseEvent.

  if (!window.PointerEvent) {

    class MockPointerEvent extends MouseEvent {

      constructor(type, props = {}) {

        super(type, props);

        Object.defineProperty(this, "pointerId", {
          configurable: true,
          value: props.pointerId ?? 1,
        });

        Object.defineProperty(this, "pointerType", {
          configurable: true,
          value: props.pointerType ?? "mouse",
        });

        Object.defineProperty(this, "isPrimary", {
          configurable: true,
          value: props.isPrimary ?? true,
        });
      }
    }

    window.PointerEvent = MockPointerEvent;
  }
});

/* =====================================================
   LIMPIEZA DESPUÉS DE CADA PRUEBA
   ===================================================== */

afterEach(() => {

  delete document.fullscreenElement;

  vi.restoreAllMocks();

});

/* =====================================================
   FUNCIÓN AUXILIAR
   ===================================================== */

const renderViewer = () => {

  return render(
      <MapViewer>
        <span>Mapa de prueba</span>
      </MapViewer>
  );

};

/* =====================================================
   PRUEBAS DEL COMPONENTE MAPVIEWER
   ===================================================== */

describe("Visor de mapas: navegación e interacciones", () => {

  /* =================================================
     TEST 01 - RENDERIZADO
     ================================================= */

  it(
      "muestra contenido, barra de herramientas e instrucciones",
      () => {

        renderViewer();

        expect(
            screen.getByText("Mapa de prueba")
        ).toBeInTheDocument();

        expect(
            screen.getByText("Explorador de mapa")
        ).toBeInTheDocument();

        expect(
            screen.getByText(/Arrastra el mapa/)
        ).toBeInTheDocument();

      }
  );

  /* =================================================
     TEST 02 - RESTABLECER POSICIÓN
     ================================================= */

  it(
      "restablece desplazamiento del mapa",
      () => {

        const { container } = renderViewer();

        const viewport = container.querySelector(
            ".map-viewer-viewport"
        );

        viewport.scrollTo = vi.fn();

        fireEvent.click(
            screen.getByRole("button", {
              name: "Restablecer posición del mapa",
            })
        );

        expect(
            viewport.scrollTo
        ).toHaveBeenCalledWith({
          top: 0,
          left: 0,
          behavior: "smooth",
        });

      }
  );

  /* =================================================
     TEST 03 - INICIAR Y FINALIZAR ARRASTRE
     ================================================= */

  it(
      "activa y desactiva el modo de arrastre con puntero primario",
      () => {

        const { container } = renderViewer();

        const viewport = container.querySelector(
            ".map-viewer-viewport"
        );

        // Simular funciones del navegador.

        viewport.setPointerCapture = vi.fn();

        viewport.hasPointerCapture = vi.fn(
            () => true
        );

        viewport.releasePointerCapture = vi.fn();

        // Iniciar arrastre con botón principal.

        fireEvent.pointerDown(viewport, {
          button: 0,
          buttons: 1,
          pointerId: 3,
          pointerType: "mouse",
          isPrimary: true,
          clientX: 50,
          clientY: 40,
        });

        // Verificar que se activa el arrastre.

        expect(
            viewport
        ).toHaveClass("is-dragging");

        expect(
            viewport.setPointerCapture
        ).toHaveBeenCalledWith(3);

        // Finalizar arrastre.

        fireEvent.pointerUp(viewport, {
          button: 0,
          buttons: 0,
          pointerId: 3,
          pointerType: "mouse",
          isPrimary: true,
          clientX: 50,
          clientY: 40,
        });

        // Verificar que finaliza correctamente.

        expect(
            viewport
        ).not.toHaveClass("is-dragging");

        expect(
            viewport.releasePointerCapture
        ).toHaveBeenCalledWith(3);

      }
  );

  /* =================================================
     TEST 04 - IGNORAR BOTONES SECUNDARIOS
     ================================================= */

  it(
      "ignora botones secundarios del puntero",
      () => {

        const { container } = renderViewer();

        const viewport = container.querySelector(
            ".map-viewer-viewport"
        );

        viewport.setPointerCapture = vi.fn();

        fireEvent.pointerDown(viewport, {
          button: 2,
          buttons: 2,
          pointerId: 5,
          pointerType: "mouse",
          clientX: 20,
          clientY: 20,
        });

        expect(
            viewport.setPointerCapture
        ).not.toHaveBeenCalled();

        expect(
            viewport
        ).not.toHaveClass("is-dragging");

      }
  );

  /* =================================================
     TEST 05 - PANTALLA COMPLETA
     ================================================= */

  it(
      "entra y sale de pantalla completa al cambiar el estado del navegador",
      async () => {

        const { container } = renderViewer();

        const section = container.querySelector(
            ".map-viewer"
        );

        section.requestFullscreen = vi.fn()
            .mockResolvedValue(undefined);

        document.exitFullscreen = vi.fn()
            .mockResolvedValue(undefined);

        // Activar pantalla completa.

        fireEvent.click(
            screen.getByRole("button", {
              name: "Mostrar mapa en pantalla completa",
            })
        );

        expect(
            section.requestFullscreen
        ).toHaveBeenCalledOnce();

        // Simular cambio de estado del navegador.

        Object.defineProperty(
            document,
            "fullscreenElement",
            {
              configurable: true,
              value: section,
            }
        );

        act(() => {

          document.dispatchEvent(
              new Event("fullscreenchange")
          );

        });

        expect(
            screen.getByRole("button", {
              name: "Salir de pantalla completa",
            })
        ).toBeInTheDocument();

        // Salir de pantalla completa.

        fireEvent.click(
            screen.getByRole("button", {
              name: "Salir de pantalla completa",
            })
        );

        expect(
            document.exitFullscreen
        ).toHaveBeenCalledOnce();

      }
  );

  /* =================================================
     TEST 06 - ERROR DE PANTALLA COMPLETA
     ================================================= */

  it(
      "maneja errores de pantalla completa sin romper el visor",
      async () => {

        const { container } = renderViewer();

        const section = container.querySelector(
            ".map-viewer"
        );

        section.requestFullscreen = vi.fn()
            .mockRejectedValue(
                new Error("No permitido")
            );

        const consoleSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        fireEvent.click(
            screen.getByRole("button", {
              name: "Mostrar mapa en pantalla completa",
            })
        );

        await vi.waitFor(() => {

          expect(
              consoleSpy
          ).toHaveBeenCalled();

        });

        // El visor debe continuar funcionando.

        expect(
            screen.getByText("Mapa de prueba")
        ).toBeInTheDocument();

      }
  );

});