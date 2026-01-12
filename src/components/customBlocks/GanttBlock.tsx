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
  "#507aff",
  "#0bc10b",
  "#e69819",
  "#d80d0d",
  "#9b59b6",
  "#1abc9c",
  "#e74c3c",
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
            padding: "16px",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            backgroundColor: "#fff",
            marginTop: "8px",
            marginBottom: "8px",
          }}
          contentEditable={false}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
              Timeline
            </h3>
            <Button
              size="xs"
              leftSection={<MdAdd size={16} />}
              onClick={addTask}
            >
              Add Task
            </Button>
          </div>

          {ganttData.tasks.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "#666",
              }}
            >
              No tasks yet. Click "Add Task" to get started.
            </div>
          ) : (
            <div style={{ display: "flex", gap: "0" }}>
              {/* Left side - Task names */}
              <div
                style={{
                  width: "200px",
                  flexShrink: 0,
                  borderRight: "1px solid #e0e0e0",
                }}
              >
                <div
                  style={{
                    height: "60px",
                    padding: "8px",
                    borderBottom: "1px solid #e0e0e0",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  Task Name
                </div>
                {ganttData.tasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      height: "50px",
                      padding: "8px",
                      borderBottom: "1px solid #f0f0f0",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <MdDragIndicator
                      size={16}
                      style={{ color: "#999", cursor: "grab" }}
                    />
                    <TextInput
                      value={task.name}
                      onChange={(e) =>
                        updateTask(task.id, { name: e.target.value })
                      }
                      size="xs"
                      styles={{
                        input: {
                          border: "none",
                          padding: "4px",
                          fontSize: "14px",
                        },
                      }}
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
                              width: "16px",
                              height: "16px",
                              backgroundColor: task.color,
                              borderRadius: "3px",
                            }}
                          />
                        </button>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <div style={{ padding: "8px" }}>
                          <ColorInput
                            value={task.color}
                            onChange={(color) =>
                              updateTask(task.id, { color })
                            }
                            format="hex"
                            swatches={defaultColors}
                          />
                        </div>
                        <Menu.Divider />
                        <Menu.Item
                          color="red"
                          leftSection={<MdDelete size={16} />}
                          onClick={() => deleteTask(task.id)}
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
                style={{ flex: 1, minWidth: 0, overflow: "auto" }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Month headers */}
                <div
                  style={{
                    height: "60px",
                    borderBottom: "1px solid #e0e0e0",
                    display: "flex",
                    position: "relative",
                  }}
                >
                  {generateMonthHeaders().map((header, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${header.width}%`,
                        borderRight: "1px solid #e0e0e0",
                        padding: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#666",
                      }}
                    >
                      {header.month}
                    </div>
                  ))}
                </div>

                {/* Task bars */}
                <div style={{ position: "relative", minHeight: "200px" }}>
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
                          top: `${idx * 50}px`,
                          left: `${left}%`,
                          width: `${width}%`,
                          height: "50px",
                          padding: "10px 0",
                          borderBottom: "1px solid #f0f0f0",
                        }}
                      >
                        <div
                          style={{
                            position: "relative",
                            height: "30px",
                            backgroundColor: task.color,
                            borderRadius: "6px",
                            cursor: draggedTask ? "grabbing" : "grab",
                            display: "flex",
                            alignItems: "center",
                            padding: "0 8px",
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: 500,
                            opacity: 0.9,
                            transition: draggedTask ? "none" : "all 0.2s",
                          }}
                          onMouseDown={(e) => handleMouseDown(e, task.id, "move")}
                        >
                          <div
                            style={{
                              position: "absolute",
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: "8px",
                              cursor: "ew-resize",
                              backgroundColor: "rgba(0,0,0,0.2)",
                              borderRadius: "6px 0 0 6px",
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
                              width: "8px",
                              cursor: "ew-resize",
                              backgroundColor: "rgba(0,0,0,0.2)",
                              borderRadius: "0 6px 6px 0",
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
                            {new Date(task.start).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
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
          )}
        </div>
      );
    },
  }
);