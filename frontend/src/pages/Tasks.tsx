import { useEffect, useState } from "react";
import { projectApi, taskApi } from "../api";

type Project = {
  id: string;
  name: string;
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate?: string | null;
  project?: {
    name: string;
  };
  assignee?: {
    email: string;
  } | null;
};

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const loadTasks = async () => {
    const response = await taskApi.list();
    setTasks(response.tasks || []);
  };

  const loadProjects = async () => {
    const response = await projectApi.list();
    const nextProjects = response.projects || [];
    setProjects(nextProjects);
    setProjectId((current) => current || nextProjects[0]?.id || "");
  };

  useEffect(() => {
    loadProjects();
    loadTasks();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await taskApi.create(projectId, title, description, assigneeEmail, dueDate || undefined);
    if (response.task) {
      setTitle("");
      setDescription("");
      setAssigneeEmail("");
      setDueDate("");
      setMessage("Task added successfully");
      loadTasks();
    } else {
      setMessage(response.error || "Unable to create task");
    }
  };

  const updateStatus = async (taskId: string, status: string) => {
    await taskApi.updateStatus(taskId, status);
    loadTasks();
  };

  return (
    <div className="card">
      <h2>Tasks</h2>
      <form onSubmit={handleCreate} className="stacked-form">
        <label>
          Project
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)} required>
            <option value="" disabled>
              Select a project
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Task title
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>
          Assignee email
          <input value={assigneeEmail} onChange={(event) => setAssigneeEmail(event.target.value)} />
        </label>
        <label>
          Due date
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>
        <button type="submit">Create task</button>
      </form>
      {message && <div className="info">{message}</div>}
      <div className="entity-list">
        {tasks.map((task) => (
          <div key={task.id} className="entity-card">
            <h3>{task.title}</h3>
            <p>{task.description || "No detail"}</p>
            <p>Status: {task.status}</p>
            <p>Project: {task.project?.name}</p>
            <p>Assignee: {task.assignee?.email || "None"}</p>
            {task.dueDate && <p>Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
            <div className="button-row">
              {task.status !== "DONE" && (
                <button onClick={() => updateStatus(task.id, "DONE")}>Mark done</button>
              )}
              {task.status === "TODO" && (
                <button onClick={() => updateStatus(task.id, "IN_PROGRESS")}>Start</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;
