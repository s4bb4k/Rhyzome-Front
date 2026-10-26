import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

import "./css/MetricTooltip.css";

const TOOLTIP_WIDTH = 240;
const TOOLTIP_GAP = 12;
const SCREEN_MARGIN = 12;

export default function MetricTooltip({ title, description }) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({
        top: 0,
        left: 0,
    });

    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);
    const tooltipId = useId();

    useLayoutEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            if (!triggerRef.current || !tooltipRef.current) return;

            const trigger = triggerRef.current.getBoundingClientRect();
            const tooltip = tooltipRef.current.getBoundingClientRect();

            const width = tooltip.width || TOOLTIP_WIDTH;
            const height = tooltip.height;

            // Preferimos mostrar el tooltip a la derecha.
            let left = trigger.right + TOOLTIP_GAP;

            // Si no cabe, intentamos mostrarlo a la izquierda.
            if (left + width > window.innerWidth - SCREEN_MARGIN) {
                left = trigger.left - width - TOOLTIP_GAP;
            }

            // Si tampoco cabe, lo mantenemos dentro de la ventana.
            left = Math.max(
                SCREEN_MARGIN,
                Math.min(left, window.innerWidth - width - SCREEN_MARGIN)
            );

            // Centramos verticalmente respecto al ícono.
            let top = trigger.top + trigger.height / 2 - height / 2;

            top = Math.max(
                SCREEN_MARGIN,
                Math.min(top, window.innerHeight - height - SCREEN_MARGIN)
            );

            setPosition({ top, left });
        };

        updatePosition();

        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);

        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            const clickedTrigger = triggerRef.current?.contains(event.target);
            const clickedTooltip = tooltipRef.current?.contains(event.target);

            if (!clickedTrigger && !clickedTooltip) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setIsOpen(false);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener("pointerdown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("pointerdown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen]);

    return (
        <>
            <span className="metric-tooltip-container">
                <button
                    ref={triggerRef}
                    type="button"
                    className="metric-tooltip-trigger"
                    aria-label={`Información sobre ${title}`}
                    aria-expanded={isOpen}
                    aria-describedby={isOpen ? tooltipId : undefined}
                    onClick={() => setIsOpen((prev) => !prev)}
                >
                    <Info size={15} strokeWidth={2} />
                </button>
            </span>

            {isOpen &&
                createPortal(
                    <div
                        ref={tooltipRef}
                        id={tooltipId}
                        className="metric-tooltip-content"
                        role="tooltip"
                        style={{
                            top: position.top,
                            left: position.left,
                        }}
                    >
                        <strong>{title}</strong>
                        <span>{description}</span>
                    </div>,
                    document.body
                )}
        </>
    );
}