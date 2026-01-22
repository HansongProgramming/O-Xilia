import { useEffect, useRef } from "react";
import { Menu, Button, TextInput, ColorInput } from "@mantine/core";
import { MdAdd, MdDragIndicator, MdDelete } from "react-icons/md";
import type { GanttData, GanttTask, DraggedTask } from "./types/gantt";
import { DAY_WIDTH, defaultColors } from "./constants/gantt";
import {
  generateDays,
  generateMonthHeaders,
  getTodayPosition,
  dateToPixels,
} from "./utils/ganttUtils";

interface GanttChartProps {
  ganttData: GanttData;
  dateRange: { start: Date; end: Date };
  draggedTask: DraggedTask | null;
  onAddTask: () => void;
  onUpdateTask: (taskId: string, updates: Partial<GanttTask>) => void;
  onDeleteTask: (taskId: string) => void;
  onMouseDown: (
    e: React.MouseEvent,
    taskId: string,
    type: "move" | "resize-start" | "resize-end"
  ) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
}

export const GanttChart = ({
  ganttData,
  dateRange,
  draggedTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: GanttChartProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const days = generateDays(dateRange.start, dateRange.end);
  const months = generateMonthHeaders(days);
  const totalWidth = days.length * DAY_WIDTH;
  const todayPosition = getTodayPosition(days);

  // Scroll to today on mount
  useEffect(() => {
    if (
      scrollContainerRef.current &&
      todayPosition >= 0 &&
      ganttData.tasks.length > 0
    ) {
      const scrollLeft =
        todayPosition - scrollContainerRef.current.clientWidth / 2;
      scrollContainerRef.current.scrollLeft = Math.max(0, scrollLeft);
    }
  }, []);

  return (
    <div className="gantt-chart-container" contentEditable={false}>
      {/* Header */}
      <div className="gantt-header">
        <h3>Timeline</h3>
        <div className="gantt-header-actions">
          <Button
            size="sm"
            leftSection={<MdAdd size={16} />}
            onClick={onAddTask}
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
        </div>
      </div>

      {ganttData.tasks.length === 0 ? (
        <div className="gantt-empty-state">
          <div className="gantt-empty-state-content">
            <p>No tasks yet. Click "Add Task" to get started.</p>
          </div>
        </div>
      ) : (
        <div className="gantt-content">
          {/* Left side - Task names */}
          <div className="gantt-task-list">
            <div className="gantt-task-list-header">Task Name</div>
            {ganttData.tasks.map((task) => (
              <div key={task.id} className="gantt-task-item">
                <MdDragIndicator size={18} className="gantt-drag-handle" />
                <TextInput
                  value={task.name}
                  onChange={(e) =>
                    onUpdateTask(task.id, { name: e.target.value })
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
                    <button className="gantt-task-color-swatch">
                      <div
                        className="gantt-color-box"
                        style={{ backgroundColor: task.color }}
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
                        onChange={(color) => onUpdateTask(task.id, { color })}
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
                      onClick={() => onDeleteTask(task.id)}
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
            ref={scrollContainerRef}
            className="gantt-timeline"
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <div style={{ width: `${totalWidth}px` }}>
              {/* Month headers */}
              <div className="gantt-month-headers">
                {months.map((header, idx) => (
                  <div
                    key={idx}
                    className="gantt-month-header"
                    style={{ width: `${header.dayCount * DAY_WIDTH}px` }}
                  >
                    {header.month} {header.year}
                  </div>
                ))}
              </div>

              {/* Day headers */}
              <div className="gantt-day-headers">
                {days.map((day, idx) => {
                  const isWeekend =
                    day.date.getDay() === 0 || day.date.getDay() === 6;
                  return (
                    <div
                      key={idx}
                      className={`gantt-day-header ${isWeekend ? "weekend" : ""}`}
                      style={{
                        width: `${DAY_WIDTH}px`,
                        minWidth: `${DAY_WIDTH}px`,
                      }}
                    >
                      <div className="gantt-day-number">{day.dayOfMonth}</div>
                      <div className="gantt-day-name">{day.dayOfWeek}</div>
                    </div>
                  );
                })}
              </div>

              {/* Task bars */}
              <div className="gantt-task-bars">
                {/* Vertical grid lines for days */}
                {days.map((day, idx) => {
                  const isWeekend =
                    day.date.getDay() === 0 || day.date.getDay() === 6;
                  return (
                    <div
                      key={idx}
                      className={`gantt-grid-line ${isWeekend ? "weekend" : ""}`}
                      style={{
                        left: `${idx * DAY_WIDTH}px`,
                        width: `${DAY_WIDTH}px`,
                      }}
                    />
                  );
                })}

                {/* Today indicator line */}
                {todayPosition >= 0 && (
                  <div
                    className="gantt-today-line"
                    style={{ left: `${todayPosition}px` }}
                  >
                    <div className="gantt-today-marker" />
                  </div>
                )}

                {ganttData.tasks.map((task, idx) => {
                  const startDate = new Date(task.start);
                  const endDate = new Date(task.end);
                  const left = dateToPixels(startDate, dateRange.start);
                  const width =
                    dateToPixels(endDate, dateRange.start) - left + DAY_WIDTH;

                  return (
                    <div
                      key={task.id}
                      className="gantt-task-row"
                      style={{
                        top: `${idx * 56}px`,
                        left: `${left}px`,
                        width: `${width}px`,
                      }}
                    >
                      <div
                        className={`gantt-task-bar ${draggedTask ? "dragging" : ""}`}
                        style={{ backgroundColor: task.color }}
                        onMouseDown={(e) => onMouseDown(e, task.id, "move")}
                      >
                        <div
                          className="gantt-task-resize-handle start"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onMouseDown(e, task.id, "resize-start");
                          }}
                        />
                        <div
                          className="gantt-task-resize-handle end"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onMouseDown(e, task.id, "resize-end");
                          }}
                        />
                        <span className="gantt-task-name">{task.name}</span>
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
};