import { useEffect, useState } from "react";
import { projectApi, taskApi } from "../api";

type Project = {
  id: string;
};

type Task = {
  id: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate?: string | null;
};

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const projectResult = await projectApi.list();
        const taskResult = await taskApi.list();
        setProjects(projectResult.projects || []);
        setTasks(taskResult.tasks || []);
      } catch (err) {
        setError("Unable to load dashboard data");
      }
    };

    load();
  }, []);

  const overdue = tasks.filter((task) => task.dueDate && new Date(task.dueDate) < new Date()).length;
  const todo = tasks.filter((task) => task.status === "TODO").length;
  const inProgress = tasks.filter((task) => task.status === "IN_PROGRESS").length;
  const done = tasks.filter((task) => task.status === "DONE").length;

  return (
    <div className="card">
      <h2>Dashboard</h2>
      {error && <div className="error">{error}</div>}
      <div className="dashboard-grid">
        <div className="panel">
          <h3>Projects</h3>
          <p>{projects.length} active</p>
        </div>
        <div className="panel">
          <h3>Tasks</h3>
          <p>{tasks.length} total</p>
        </div>
        <div className="panel">
          <h3>To Do</h3>
          <p>{todo}</p>
        </div>
        <div className="panel">
          <h3>In Progress</h3>
          <p>{inProgress}</p>
        </div>
        <div className="panel">
          <h3>Completed</h3>
          <p>{done}</p>
        </div>
        <div className="panel">
          <h3>Overdue</h3>
          <p>{overdue}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
