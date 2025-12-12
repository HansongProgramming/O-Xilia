// NodeGraphBlock.tsx
import { createReactBlockSpec } from "@blocknote/react";
import type { PropSchema } from "@blocknote/core";
import React, { useEffect, useRef, useState } from "react";

type NodeType = "todo" | "reminder" | "warning" | "faq";

interface NodeItem {
    id: string;
    x: number;
    y: number;
    type: NodeType;
    todos: string[]; // for todo list popup
}

interface Connection {
    from: string;
    to: string;
}

const propSchema = {
    nodes: { default: "[]" },
    connections: { default: "[]" }
} satisfies PropSchema;

export const nodeGraphBlock = createReactBlockSpec(
    {
        type: "node-graph",
        propSchema,
        content: "none",
    },
    {
        render: ({ block, editor }) => {
            const canvasRef = useRef<HTMLCanvasElement>(null);

            const [nodes, setNodes] = useState<NodeItem[]>(
                JSON.parse(block.props.nodes)
            );

            const [connections, setConnections] = useState<Connection[]>(
                JSON.parse(block.props.connections)
            );

            const [activeNode, setActiveNode] = useState<NodeItem | null>(null);
            const [selectedType, setSelectedType] = useState<NodeType>("todo");
            const [connectingFrom, setConnectingFrom] = useState<NodeItem | null>(null);
            const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);


            // ---- Save to BlockNote ----
            const sync = (newNodes: NodeItem[], newConns: Connection[]) => {
                editor.updateBlock(block, {
                    type: "node-graph",
                    props: {
                        nodes: JSON.stringify(newNodes),
                        connections: JSON.stringify(newConns),
                    },
                });
            };

            // --- Draw nodes + connections ---
            const draw = () => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw existing connections
                ctx.strokeStyle = "#555";
                ctx.lineWidth = 2;

                connections.forEach((c) => {
                    const a = nodes.find((n) => n.id === c.from);
                    const b = nodes.find((n) => n.id === c.to);
                    if (!a || !b) return;

                    ctx.beginPath();
                    ctx.moveTo(a.x + 50, a.y + 50);
                    ctx.lineTo(b.x + 50, b.y + 50);
                    ctx.stroke();
                });

                // Draw "pending" connection line while dragging
                if (connectingFrom && hoverPos) {
                    ctx.strokeStyle = "#33aaff";
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(connectingFrom.x + 50, connectingFrom.y + 50);
                    ctx.lineTo(hoverPos.x, hoverPos.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                // Draw nodes
                nodes.forEach((n) => {
                    ctx.fillStyle =
                        n.type === "todo"
                            ? "#82cfff"
                            : n.type === "reminder"
                                ? "#f6d860"
                                : n.type === "warning"
                                    ? "#ff6f6f"
                                    : "#c3a6ff";

                    ctx.fillRect(n.x, n.y, 100, 100);

                    ctx.fillStyle = "black";
                    ctx.font = "14px sans-serif";
                    ctx.fillText(n.type.toUpperCase(), n.x + 10, n.y + 25);

                    // Highlight node when selected for connection
                    if (connectingFrom?.id === n.id) {
                        ctx.strokeStyle = "#33aaff";
                        ctx.lineWidth = 3;
                        ctx.strokeRect(n.x - 2, n.y - 2, 104, 104);
                    }
                });
            };


            // Redraw anytime state changes
            useEffect(draw, [nodes, connections]);

            // Canvas pointer events (dragging + clicking)
            useEffect(() => {
                const canvas = canvasRef.current;
                if (!canvas) return;

                let draggingNode: NodeItem | null = null;
                let offsetX = 0;
                let offsetY = 0;

                const getPos = (e: PointerEvent) => {
                    const rect = canvas.getBoundingClientRect();
                    return {
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                    };
                };

                const pointerdown = (e: PointerEvent) => {
                    const pos = getPos(e);

                    const hit = nodes.find(
                        (n) => pos.x >= n.x && pos.x <= n.x + 100 && pos.y >= n.y && pos.y <= n.y + 100
                    );

                    // --- STEP 1: If connectingFrom exists, this click finalizes a connection ---
                    if (connectingFrom && hit && hit.id !== connectingFrom.id) {
                        const exists = connections.some(
                            (c) =>
                                (c.from === connectingFrom.id && c.to === hit.id) ||
                                (c.from === hit.id && c.to === connectingFrom.id)
                        );

                        if (!exists) {
                            const newConns = [
                                ...connections,
                                { from: connectingFrom.id, to: hit.id },
                            ];
                            setConnections(newConns);
                            sync(nodes, newConns);
                        }

                        setConnectingFrom(null);
                        setHoverPos(null);
                        return;
                    }

                    // --- STEP 2: Clicking a node toggles connection start mode ---
                    if (hit) {
                        setConnectingFrom(hit);
                        draggingNode = hit;
                        const p = getPos(e);
                        offsetX = p.x - hit.x;
                        offsetY = p.y - hit.y;
                        return;
                    }

                    // --- STEP 3: Clicking empty space = create new node ---
                    const newNode: NodeItem = {
                        id: crypto.randomUUID(),
                        x: pos.x - 50,
                        y: pos.y - 50,
                        type: selectedType,
                        todos: [],
                    };

                    const newNodes = [...nodes, newNode];
                    setNodes(newNodes);
                    sync(newNodes, connections);
                };

                const pointermove = (e: PointerEvent) => {
                    const pos = getPos(e);
                    setHoverPos(pos);

                    // dragging a node
                    if (draggingNode) {
                        draggingNode.x = pos.x - offsetX;
                        draggingNode.y = pos.y - offsetY;

                        const newNodes = [...nodes];
                        setNodes(newNodes);
                        sync(newNodes, connections);
                        return;
                    }
                };

                const pointerup = () => {
                    draggingNode = null;
                };

                canvas.addEventListener("pointerdown", pointerdown);
                canvas.addEventListener("pointermove", pointermove);
                canvas.addEventListener("pointerup", pointerup);

                return () => {
                    canvas.removeEventListener("pointerdown", pointerdown);
                    canvas.removeEventListener("pointermove", pointermove);
                    canvas.removeEventListener("pointerup", pointerup);
                };
            }, [nodes, connections, selectedType, connectingFrom]);


            return (
                <div>
                    {/* Toolbar */}
                    <div style={{ marginBottom: 8, display: "flex", gap: 8 }}>
                        <label>Node type:</label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as NodeType)}
                        >
                            <option value="todo">Todo</option>
                            <option value="reminder">Reminder</option>
                            <option value="warning">Warning</option>
                            <option value="faq">FAQ</option>
                        </select>
                    </div>

                    {/* Canvas */}
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={400}
                        style={{
                            width: "100%",
                            border: "1px solid #444",
                            display: "block",
                            touchAction: "none",
                        }}
                        onClick={(e) => {
                            const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
                            const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                            const hit = nodes.find(
                                (n) => pos.x >= n.x && pos.x <= n.x + 100 && pos.y >= n.y && pos.y <= n.y + 100
                            );
                            if (hit) setActiveNode(hit);
                        }}
                    />

                    {/* Popup for node editing */}
                    {activeNode && (
                        <div
                            style={{
                                position: "fixed",
                                top: "30%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                background: "white",
                                padding: 20,
                                borderRadius: 8,
                                width: 300,
                                zIndex: 999,
                                boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                            }}
                        >
                            <h3>{activeNode.type.toUpperCase()} Node</h3>

                            <ul>
                                {activeNode.todos.map((t, i) => (
                                    <li key={i}>{t}</li>
                                ))}
                            </ul>

                            <input
                                type="text"
                                placeholder="Add item..."
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        const val = (e.target as HTMLInputElement).value;
                                        const updated = nodes.map((n) =>
                                            n.id === activeNode.id
                                                ? { ...n, todos: [...n.todos, val] }
                                                : n
                                        );
                                        setNodes(updated);
                                        sync(updated, connections);
                                        (e.target as HTMLInputElement).value = "";
                                    }
                                }}
                            />

                            <button onClick={() => setActiveNode(null)} style={{ marginTop: 10 }}>
                                Close
                            </button>
                        </div>
                    )}
                </div>
            );
        },
    }
);
