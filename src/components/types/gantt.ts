export interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  color: string;
}

export interface GanttData {
  tasks: GanttTask[];
  viewStart?: string;
  viewEnd?: string;
}

export interface DraggedTask {
  taskId: string;
  type: "move" | "resize-start" | "resize-end";
  startX: number;
  initialStart: Date;
  initialEnd: Date;
}