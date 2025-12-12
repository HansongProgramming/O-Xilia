// WhiteboardBlock.tsx
import { createReactBlockSpec } from "@blocknote/react";
import type { PropSchema } from "@blocknote/core";
import { useRef, useEffect } from "react";

/* ------------------------------------------------------------------ */
/* types                                                              */
/* ------------------------------------------------------------------ */
type Point = { x: number; y: number };
type Stroke = Point[];

/* ------------------------------------------------------------------ */
/* prop schema  (BlockNote wants primitives)                          */
/* ------------------------------------------------------------------ */
const propSchema = {
  strokes: {
    default: "[]", // JSON string
  },
} satisfies PropSchema;

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */
const throttleRAF = <A extends unknown[]>(fn: (...a: A) => void) => {
  let raf = 0;
  return (...args: A) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => fn(...args));
  };
};

/* ------------------------------------------------------------------ */
/* block spec                                                         */
/* ------------------------------------------------------------------ */
export const whiteboardBlock = createReactBlockSpec(
  {
    type: "whiteboard",
    propSchema,
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const canvasRef = useRef<HTMLCanvasElement>(null);

      /* -------------------------------------------------------------- */
      /* redraw canvas                                                  */
      /* -------------------------------------------------------------- */
      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#000";

        const strokes: Stroke[] = JSON.parse(block.props.strokes);
        strokes.forEach((stroke) => {
          ctx.beginPath();
          stroke.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
          ctx.stroke();
        });
      }, [block.props.strokes]);

      /* -------------------------------------------------------------- */
      /* drawing logic                                                  */
      /* -------------------------------------------------------------- */
      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let drawing = false;

        const start = (e: PointerEvent) => {
          drawing = true;
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const strokes: Stroke[] = JSON.parse(block.props.strokes);
          editor.updateBlock(block, {
            type: "whiteboard",
            props: { strokes: JSON.stringify([...strokes, [{ x, y }]]) },
          });
        };

        const move = throttleRAF((e: PointerEvent) => {
          if (!drawing) return;
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const strokes: Stroke[] = JSON.parse(block.props.strokes);
          const last = strokes[strokes.length - 1];
          editor.updateBlock(block, {
            type: "whiteboard",
            props: {
              strokes: JSON.stringify([
                ...strokes.slice(0, -1),
                [...last, { x, y }],
              ]),
            },
          });
        });

        const stop = () => {
          drawing = false;
        };

        canvas.addEventListener("pointerdown", start);
        canvas.addEventListener("pointermove", move);
        canvas.addEventListener("pointerup", stop);
        canvas.addEventListener("pointerleave", stop);

        return () => {
          canvas.removeEventListener("pointerdown", start);
          canvas.removeEventListener("pointermove", move);
          canvas.removeEventListener("pointerup", stop);
          canvas.removeEventListener("pointerleave", stop);
        };
      }, [block, editor]);

      /* -------------------------------------------------------------- */
      /* JSX                                                            */
      /* -------------------------------------------------------------- */
      return (
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: "100%",
            height: "250px",
            border: "1px solid #ccc",
            touchAction: "none",
          }}
        />
      );
    },
  }
);