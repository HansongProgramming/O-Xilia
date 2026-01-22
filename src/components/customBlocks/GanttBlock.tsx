import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { useEffect, useState } from "react";
import { GanttChart } from "../GanttChart";
import type { GanttData, GanttTask, DraggedTask } from "../types/gantt";
import { getDateRange } from "../utils/ganttUtils";
import { defaultColors, DAY_WIDTH } from "../constants/gantt";
import "../../index.css";

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

      const [draggedTask, setDraggedTask] = useState<DraggedTask | null>(null);

      useEffect(() => {
        const newData = JSON.stringify(ganttData);
        if (newData !== props.block.props.data) {
          props.editor.updateBlock(props.block, {
            type: "gantt",
            props: { data: newData },
          });
        }
      }, [ganttData]);

      const dateRange = getDateRange(ganttData);

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

        const deltaX = e.clientX - draggedTask.startX;
        const deltaDays = Math.round(deltaX / DAY_WIDTH);

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

      return (
        <GanttChart
          ganttData={ganttData}
          dateRange={dateRange}
          draggedTask={draggedTask}
          onAddTask={addTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      );
    },
  }
);