import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { useEffect, useRef, useState } from "react";
import { Menu, Button, TextInput, Group, Modal } from "@mantine/core";
import { MdAdd, MdEdit, MdDelete, MdMoreVert } from "react-icons/md";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import "chartjs-adapter-date-fns";

import "../../index.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  color?: string;
}

interface GanttData {
  tasks: GanttTask[];
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
          tasks: [
            {
              id: "1",
              name: "Task 1",
              start: new Date().toISOString().split("T")[0],
              end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
              color: defaultColors[0],
            },
          ],
        } as GanttData),
      },
    },
    content: "none",
  },
  {
    render: (props) => {
      const chartRef = useRef<any>(null);
      const [ganttData, setGanttData] = useState<GanttData>(() => {
        try {
          return JSON.parse(props.block.props.data);
        } catch {
          return { tasks: [] };
        }
      });
      const [isModalOpen, setIsModalOpen] = useState(false);
      const [editingTask, setEditingTask] = useState<GanttTask | null>(null);
      const [taskForm, setTaskForm] = useState({
        name: "",
        start: "",
        end: "",
      });

      useEffect(() => {
        const newData = JSON.stringify(ganttData);
        if (newData !== props.block.props.data) {
          props.editor.updateBlock(props.block, {
            type: "gantt",
            props: { data: newData },
          });
        }
      }, [ganttData]);

      const openAddTaskModal = () => {
        setEditingTask(null);
        setTaskForm({
          name: "",
          start: new Date().toISOString().split("T")[0],
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        });
        setIsModalOpen(true);
      };

      const openEditTaskModal = (task: GanttTask) => {
        setEditingTask(task);
        setTaskForm({
          name: task.name,
          start: task.start,
          end: task.end,
        });
        setIsModalOpen(true);
      };

      const handleSaveTask = () => {
        if (!taskForm.name || !taskForm.start || !taskForm.end) return;

        if (editingTask) {
          setGanttData({
            tasks: ganttData.tasks.map((t) =>
              t.id === editingTask.id
                ? { ...t, ...taskForm }
                : t
            ),
          });
        } else {
          const newTask: GanttTask = {
            id: Date.now().toString(),
            ...taskForm,
            color:
              defaultColors[ganttData.tasks.length % defaultColors.length],
          };
          setGanttData({
            tasks: [...ganttData.tasks, newTask],
          });
        }
        setIsModalOpen(false);
      };

      const handleDeleteTask = (taskId: string) => {
        setGanttData({
          tasks: ganttData.tasks.filter((t) => t.id !== taskId),
        });
      };

      const chartData = {
        labels: ganttData.tasks.map((task) => task.name),
        datasets: [
          {
            label: "Tasks",
            data: ganttData.tasks.map((task) => {
              const start = new Date(task.start).getTime();
              const end = new Date(task.end).getTime();
              return [start, end];
            }),
            backgroundColor: ganttData.tasks.map(
              (task) => task.color || "#507aff"
            ),
            borderWidth: 1,
            borderColor: ganttData.tasks.map(
              (task) => task.color || "#507aff"
            ),
            borderSkipped: false,
          },
        ],
      };

      const options = {
        indexAxis: "y" as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const task = ganttData.tasks[context.dataIndex];
                return `${task.start} → ${task.end}`;
              },
            },
          },
        },
        scales: {
          x: {
            type: "time" as const,
            time: {
              unit: "day" as const,
            },
            title: {
              display: true,
              text: "Timeline",
            },
          },
          y: {
            beginAtZero: true,
          },
        },
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
              Gantt Chart
            </h3>
            <Button
              size="xs"
              leftSection={<MdAdd size={16} />}
              onClick={openAddTaskModal}
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
            <>
              <div style={{ height: `${Math.max(200, ganttData.tasks.length * 50)}px` }}>
                <Bar ref={chartRef} data={chartData} options={options} />
              </div>

              <div style={{ marginTop: "16px" }}>
                {ganttData.tasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          backgroundColor: task.color,
                          borderRadius: "2px",
                        }}
                      />
                      <span style={{ fontWeight: 500 }}>{task.name}</span>
                      <span style={{ color: "#666", fontSize: "14px" }}>
                        {task.start} → {task.end}
                      </span>
                    </div>
                    <Menu withinPortal={false}>
                      <Menu.Target>
                        <Button variant="subtle" size="xs" p={4}>
                          <MdMoreVert size={16} />
                        </Button>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<MdEdit size={16} />}
                          onClick={() => openEditTaskModal(task)}
                        >
                          Edit
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<MdDelete size={16} />}
                          color="red"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </div>
                ))}
              </div>
            </>
          )}

          <Modal
            opened={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={editingTask ? "Edit Task" : "Add Task"}
          >
            <TextInput
              label="Task Name"
              placeholder="Enter task name"
              value={taskForm.name}
              onChange={(e) =>
                setTaskForm({ ...taskForm, name: e.target.value })
              }
              mb="md"
            />
            <TextInput
              label="Start Date"
              type="date"
              value={taskForm.start}
              onChange={(e) =>
                setTaskForm({ ...taskForm, start: e.target.value })
              }
              mb="md"
            />
            <TextInput
              label="End Date"
              type="date"
              value={taskForm.end}
              onChange={(e) =>
                setTaskForm({ ...taskForm, end: e.target.value })
              }
              mb="md"
            />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTask}>
                {editingTask ? "Update" : "Add"}
              </Button>
            </Group>
          </Modal>
        </div>
      );
    },
  }
);