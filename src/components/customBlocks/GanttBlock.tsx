import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { useEffect, useState } from "react";
import { Menu, Button, TextInput, ColorInput } from "@mantine/core";
import { MdAdd, MdDragIndicator, MdDelete } from "react-icons/md";
import "../../index.css";

interface GanttTask {
    id: string;
    name: string;
    start: string;
    end: string;
    color: string;
}

interface GanttData {
    tasks: GanttTask[];
    viewStart?: string;
    viewEnd?: string;
}

const defaultColors = [
    "#2f80ed",
    "#27ae60",
    "#f1c40f",
    "#e74c3c",
    "#9b59b6",
    "#1abc9c",
    "#e67e22",
    "#3498db",
];

export const ganttBlock = createReactBlockSpec(
    {
        type: "gantt",
        propSchema: {
            textAlignment: defaultProps.textAlignment,
            data: {
                default: JSON.stringify({
                    tasks: [],
                } as GanttData),
            },
        },
        content: "none",
    },
    {
        render: (props) => {
            const [ganttData, setGanttData] = useState<GanttData>(() => {
                try {
                    return JSON.parse(props.block.props.data);
                } catch {
                    return { tasks: [] };
                }
            });

            const [draggedTask, setDraggedTask] = useState<{
                taskId: string;
                type: "move" | "resize-start" | "resize-end";
                startX: number;
                initialStart: Date;
                initialEnd: Date;
            } | null>(null);

            useEffect(() => {
                const newData = JSON.stringify(ganttData);
                if (newData !== props.block.props.data) {
                    props.editor.updateBlock(props.block, {
                        type: "gantt",
                        props: { data: newData },
                    });
                }
            }, [ganttData]);

            // Calculate date range
            const getDateRange = () => {
                if (ganttData.tasks.length === 0) {
                    const today = new Date();
                    const endDate = new Date(today);
                    endDate.setDate(today.getDate() + 30);
                    return { start: today, end: endDate };
                }

                const dates = ganttData.tasks.flatMap((t) => [
                    new Date(t.start),
                    new Date(t.end),
                ]);
                const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
                const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

                // Add padding
                minDate.setDate(minDate.getDate() - 3);
                maxDate.setDate(maxDate.getDate() + 7);

                return { start: minDate, end: maxDate };
            };

            const dateRange = getDateRange();
            const totalDays = Math.ceil(
                (dateRange.end.getTime() - dateRange.start.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            const dateToPosition = (date: Date) => {
                const days =
                    (date.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
                return (days / totalDays) * 100;
            };

            const positionToDate = (position: number) => {
                const days = (position / 100) * totalDays;
                const date = new Date(dateRange.start);
                date.setDate(date.getDate() + days);
                return date;
            };

            const addTask = () => {
                const today = new Date();
                const endDate = new Date(today);
                endDate.setDate(today.getDate() + 7);

                const newTask: GanttTask = {
                    id: Date.now().toString(),
                    name: "New Task",
                    start: today.toISOString().split("T")[0],
                    end: endDate.toISOString().split("T")[0],
                    color: defaultColors[ganttData.tasks.length % defaultColors.length],
                };

                setGanttData({
                    ...ganttData,
                    tasks: [...ganttData.tasks, newTask],
                });
            };

            const updateTask = (taskId: string, updates: Partial<GanttTask>) => {
                setGanttData({
                    ...ganttData,
                    tasks: ganttData.tasks.map((t) =>
                        t.id === taskId ? { ...t, ...updates } : t
                    ),
                });
            };

            const deleteTask = (taskId: string) => {
                setGanttData({
                    ...ganttData,
                    tasks: ganttData.tasks.filter((t) => t.id !== taskId),
                });
            };

            const handleMouseDown = (
                e: React.MouseEvent,
                taskId: string,
                type: "move" | "resize-start" | "resize-end"
            ) => {
                e.preventDefault();
                const task = ganttData.tasks.find((t) => t.id === taskId);
                if (!task) return;

                setDraggedTask({
                    taskId,
                    type,
                    startX: e.clientX,
                    initialStart: new Date(task.start),
                    initialEnd: new Date(task.end),
                });
            };

            const handleMouseMove = (e: React.MouseEvent) => {
                if (!draggedTask) return;

                const container = e.currentTarget as HTMLElement;
                const rect = container.getBoundingClientRect();
                const deltaX = e.clientX - draggedTask.startX;
                const deltaPercent = (deltaX / rect.width) * 100;
                const deltaDays = (deltaPercent / 100) * totalDays;

                const task = ganttData.tasks.find((t) => t.id === draggedTask.taskId);
                if (!task) return;

                let newStart = new Date(draggedTask.initialStart);
                let newEnd = new Date(draggedTask.initialEnd);

                if (draggedTask.type === "move") {
                    newStart.setDate(newStart.getDate() + deltaDays);
                    newEnd.setDate(newEnd.getDate() + deltaDays);
                } else if (draggedTask.type === "resize-start") {
                    newStart.setDate(newStart.getDate() + deltaDays);
                    if (newStart >= newEnd) {
                        newStart = new Date(newEnd);
                        newStart.setDate(newStart.getDate() - 1);
                    }
                } else if (draggedTask.type === "resize-end") {
                    newEnd.setDate(newEnd.getDate() + deltaDays);
                    if (newEnd <= newStart) {
                        newEnd = new Date(newStart);
                        newEnd.setDate(newEnd.getDate() + 1);
                    }
                }

                updateTask(draggedTask.taskId, {
                    start: newStart.toISOString().split("T")[0],
                    end: newEnd.toISOString().split("T")[0],
                });
            };

            const handleMouseUp = () => {
                setDraggedTask(null);
            };

            // Generate month headers
            const generateMonthHeaders = () => {
                const headers: { month: string; width: number }[] = [];
                let currentDate = new Date(dateRange.start);
                const endDate = new Date(dateRange.end);

                while (currentDate < endDate) {
                    const monthStart = new Date(currentDate);
                    const monthEnd = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth() + 1,
                        0
                    );
                    const clampedEnd =
                        monthEnd > endDate ? new Date(endDate) : monthEnd;

                    const startPos = dateToPosition(monthStart);
                    const endPos = dateToPosition(clampedEnd);

                    headers.push({
                        month: monthStart.toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                        }),
                        width: endPos - startPos,
                    });

                    currentDate = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth() + 1,
                        1
                    );
                }

                return headers;
            };

            return (
                <div
                    className="gantt-chart-container"
                    style={{
                        position: "relative",
                        width: "100%",
                        maxWidth: "100%",
                        height: "400px",
                        maxHeight: "400px",
                        backgroundColor: "var(--bg0, #17181A)",
                        color: "var(--text1, #e0e0e0)",
                        display: "flex",
                        flexDirection: "column",
                        fontFamily: "var(--font, 'Roboto', sans-serif)",
                        borderRadius: "8px",
                        border: "1px solid var(--border, #444B57)",
                        overflow: "hidden",
                    }}

                    contentEditable={false}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: "16px 24px",
                            borderBottom: "1px solid var(--border, #444B57)",
                            backgroundColor: "var(--bg1, #212225)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexShrink: 0,
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: "18px",
                                fontWeight: 600,
                                color: "var(--text0, #ffffff)",
                            }}
                        >
                            Timeline
                        </h3>
                        <div style={{ display: "flex", gap: "12px" }}>
                            <Button
                                size="sm"
                                leftSection={<MdAdd size={16} />}
                                onClick={addTask}
                                styles={{
                                    root: {
                                        backgroundColor: "var(--accent, #2f80ed)",
                                        color: "#ffffff",
                                        border: "none",
                                    },
                                }}
                            >
                                Add Task
                            </Button>
                            <Button
                                size="sm"
                                variant="subtle"
                                onClick={() => {
                                    props.editor.updateBlock(props.block, {
                                        type: "gantt",
                                        props: { data: props.block.props.data },
                                    });
                                    // This will trigger a re-render and close fullscreen
                                    const container = document.querySelector('.gantt-chart-container');
                                    if (container) {
                                        (container as HTMLElement).style.position = 'relative';
                                    }
                                }}
                                styles={{
                                    root: {
                                        color: "var(--text1, #e0e0e0)",
                                        backgroundColor: "var(--bg2, #252525)",
                                    },
                                }}
                            >
                                Close
                            </Button>
                        </div>
                    </div>

                    {ganttData.tasks.length === 0 ? (
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--text2, #b3b3b3)",
                            }}
                        >
                            <div style={{ textAlign: "center" }}>
                                <p style={{ fontSize: "16px", marginBottom: "16px" }}>
                                    No tasks yet. Click "Add Task" to get started.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                            {/* Left side - Task names */}
                            <div
                                style={{
                                    width: "280px",
                                    flexShrink: 0,
                                    borderRight: "1px solid var(--border, #444B57)",
                                    backgroundColor: "var(--bg1, #212225)",
                                    overflowY: "auto",
                                }}
                            >
                                <div
                                    style={{
                                        height: "60px",
                                        padding: "16px",
                                        borderBottom: "1px solid var(--border, #444B57)",
                                        fontWeight: 600,
                                        display: "flex",
                                        alignItems: "center",
                                        fontSize: "14px",
                                        color: "var(--text0, #ffffff)",
                                    }}
                                >
                                    Task Name
                                </div>
                                {ganttData.tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        style={{
                                            height: "56px",
                                            padding: "12px 16px",
                                            borderBottom: "1px solid var(--border, #444B57)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            backgroundColor: "var(--bg1, #212225)",
                                        }}
                                    >
                                        <MdDragIndicator
                                            size={18}
                                            style={{ color: "var(--text3, #888888)", cursor: "grab" }}
                                        />
                                        <TextInput
                                            value={task.name}
                                            onChange={(e) =>
                                                updateTask(task.id, { name: e.target.value })
                                            }
                                            size="sm"
                                            styles={{
                                                input: {
                                                    border: "none",
                                                    backgroundColor: "transparent",
                                                    color: "var(--text1, #e0e0e0)",
                                                    padding: "4px 8px",
                                                    fontSize: "14px",
                                                },
                                            }}
                                            style={{ flex: 1 }}
                                        />
                                        <Menu withinPortal={false}>
                                            <Menu.Target>
                                                <button
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        padding: "4px",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: "20px",
                                                            height: "20px",
                                                            backgroundColor: task.color,
                                                            borderRadius: "var(--radius, 4px)",
                                                            border: "1px solid var(--border, #444B57)",
                                                        }}
                                                    />
                                                </button>
                                            </Menu.Target>
                                            <Menu.Dropdown
                                                styles={{
                                                    dropdown: {
                                                        backgroundColor: "var(--bg1, #212225)",
                                                        border: "1px solid var(--border, #444B57)",
                                                    },
                                                }}
                                            >
                                                <div style={{ padding: "12px" }}>
                                                    <ColorInput
                                                        value={task.color}
                                                        onChange={(color) =>
                                                            updateTask(task.id, { color })
                                                        }
                                                        format="hex"
                                                        swatches={defaultColors}
                                                        styles={{
                                                            input: {
                                                                backgroundColor: "var(--bg2, #252525)",
                                                                borderColor: "var(--border, #444B57)",
                                                                color: "var(--text1, #e0e0e0)",
                                                            },
                                                        }}
                                                    />
                                                </div>
                                                <Menu.Divider
                                                    style={{ borderColor: "var(--border, #444B57)" }}
                                                />
                                                <Menu.Item
                                                    color="var(--red, #e74c3c)"
                                                    leftSection={<MdDelete size={16} />}
                                                    onClick={() => deleteTask(task.id)}
                                                    styles={{
                                                        item: {
                                                            color: "var(--text1, #e0e0e0)",
                                                            "&:hover": {
                                                                backgroundColor: "var(--bg2, #252525)",
                                                            },
                                                        },
                                                    }}
                                                >
                                                    Delete
                                                </Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </div>
                                ))}
                            </div>

                            {/* Right side - Timeline */}
                            <div
                                style={{
                                    flex: 1,
                                    overflowX: "auto",
                                    overflowY: "auto",
                                    backgroundColor: "var(--bg0, #17181A)",
                                }}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                            >
                                <div style={{ minWidth: "800px" }}>
                                    {/* Month headers */}
                                    <div
                                        style={{
                                            height: "60px",
                                            borderBottom: "1px solid var(--border, #444B57)",
                                            display: "flex",
                                            position: "relative",
                                            backgroundColor: "var(--bg1, #212225)",
                                        }}
                                    >
                                        {generateMonthHeaders().map((header, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    width: `${header.width}%`,
                                                    borderRight: "1px solid var(--border, #444B57)",
                                                    padding: "16px",
                                                    fontSize: "13px",
                                                    fontWeight: 600,
                                                    color: "var(--text0, #ffffff)",
                                                }}
                                            >
                                                {header.month}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Task bars */}
                                    <div style={{ position: "relative", minHeight: "400px" }}>
                                        {ganttData.tasks.map((task, idx) => {
                                            const startDate = new Date(task.start);
                                            const endDate = new Date(task.end);
                                            const left = dateToPosition(startDate);
                                            const width =
                                                dateToPosition(endDate) - dateToPosition(startDate);

                                            return (
                                                <div
                                                    key={task.id}
                                                    style={{
                                                        position: "absolute",
                                                        top: `${idx * 56}px`,
                                                        left: `${left}%`,
                                                        width: `${width}%`,
                                                        height: "56px",
                                                        padding: "12px 0",
                                                        borderBottom: "1px solid var(--border, #444B57)",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            position: "relative",
                                                            height: "32px",
                                                            backgroundColor: task.color,
                                                            borderRadius: "var(--radius, 4px)",
                                                            cursor: draggedTask ? "grabbing" : "grab",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            padding: "0 12px",
                                                            color: "#ffffff",
                                                            fontSize: "13px",
                                                            fontWeight: 500,
                                                            opacity: 0.95,
                                                            transition: draggedTask ? "none" : "all 0.2s",
                                                            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                                        }}
                                                        onMouseDown={(e) =>
                                                            handleMouseDown(e, task.id, "move")
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                position: "absolute",
                                                                left: 0,
                                                                top: 0,
                                                                bottom: 0,
                                                                width: "10px",
                                                                cursor: "ew-resize",
                                                                backgroundColor: "rgba(0,0,0,0.2)",
                                                                borderRadius: "var(--radius, 4px) 0 0 var(--radius, 4px)",
                                                            }}
                                                            onMouseDown={(e) => {
                                                                e.stopPropagation();
                                                                handleMouseDown(e, task.id, "resize-start");
                                                            }}
                                                        />
                                                        <div
                                                            style={{
                                                                position: "absolute",
                                                                right: 0,
                                                                top: 0,
                                                                bottom: 0,
                                                                width: "10px",
                                                                cursor: "ew-resize",
                                                                backgroundColor: "rgba(0,0,0,0.2)",
                                                                borderRadius: "0 var(--radius, 4px) var(--radius, 4px) 0",
                                                            }}
                                                            onMouseDown={(e) => {
                                                                e.stopPropagation();
                                                                handleMouseDown(e, task.id, "resize-end");
                                                            }}
                                                        />
                                                        <span
                                                            style={{
                                                                whiteSpace: "nowrap",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                            }}
                                                        >
                                                            {new Date(task.start).toLocaleDateString(
                                                                "en-US",
                                                                {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                }
                                                            )}{" "}
                                                            -{" "}
                                                            {new Date(task.end).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        },
    }
);