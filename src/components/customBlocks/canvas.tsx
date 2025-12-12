// WhiteboardBlock.tsx
import { createReactBlockSpec } from "@blocknote/react";
import type { PropSchema } from "@blocknote/core";
import { useRef, useEffect } from "react";

type Point = { x: number; y: number };
type Stroke = Point[];

const propSchema = {
  strokes: {
    default: "[]", // JSON string
  },
} satisfies PropSchema;

export const whiteboardBlock = createReactBlockSpec(
  {
    type: "whiteboard",
    propSchema,
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      const currentStroke = useRef<Stroke | null>(null);

      // Draw all strokes
      const draw = (ctx: CanvasRenderingContext2D, strokes: Stroke[]) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#000";

        strokes.forEach((stroke) => {
          if (!stroke.length) return;
          ctx.beginPath();
          stroke.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
          ctx.stroke();
        });
      };

      // Initial rendering & updates
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

        const strokes: Stroke[] = JSON.parse(block.props.strokes);
        draw(ctx, strokes);
      }, [block.props.strokes]);

      // Drawing logic
      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let drawing = false;

        const getPos = (e: PointerEvent) => ({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });

        const start = (e: PointerEvent) => {
          drawing = true;
          currentStroke.current = [getPos(e)];
        };

        const move = (e: PointerEvent) => {
          if (!drawing || !currentStroke.current) return;
          const point = getPos(e);
          currentStroke.current.push(point);

          // Draw current stroke on top of existing strokes
          const strokes: Stroke[] = JSON.parse(block.props.strokes);
          draw(ctx, [...strokes, currentStroke.current]);
        };

        const stop = () => {
          if (!drawing || !currentStroke.current) return;
          drawing = false;

          const strokes: Stroke[] = JSON.parse(block.props.strokes);
          const updatedStrokes = [...strokes, currentStroke.current];
          editor.updateBlock(block, {
            type: "whiteboard",
            props: { strokes: JSON.stringify(updatedStrokes) },
          });

          currentStroke.current = null;
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

      return (
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: "100%",
            height: "250px",
            border: "1px solid #333333ff",
            touchAction: "none",
          }}
        />
      );
    },
  }
);
