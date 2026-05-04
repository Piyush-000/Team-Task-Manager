import { useEffect, useState } from "react";
import { projectApi } from "../api";

type Project = {
  id: string;
  name: string;
  description?: string | null;
  owner?: {
    email: string;
  };
  members?: unknown[];
};

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [memberEmails, setMemberEmails] = useState<Record<string, string>>({});

  const load = async () => {
    const response = await projectApi.list();
    setProjects(response.projects || []);
  };

  const handleAddMember = async (event: React.FormEvent, projectId: string) => {
    event.preventDefault();
    const email = memberEmails[projectId]?.trim();
    if (!email) return;

    const response = await projectApi.addMember(projectId, email);
    if (response.membership) {
      setMemberEmails((current) => ({ ...current, [projectId]: "" }));
      setMessage("Member added successfully");
      load();
    } else {
      setMessage(response.error || "Unable to add member");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await projectApi.create(name, description);
    if (response.project) {
      setName("");
      setDescription("");
      setMessage("Project created successfully");
      load();
    } else {
      setMessage(response.error || "Unable to create project");
    }
  };

  return (
    <div className="card">
      <h2>Projects</h2>
      <form onSubmit={handleCreate} className="stacked-form">
        <label>
          Project name
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <button type="submit">Create project</button>
      </form>
      {message && <div className="info">{message}</div>}
      <div className="entity-list">
        {projects.map((project) => (
          <div key={project.id} className="entity-card">
            <h3>{project.name}</h3>
            <p>{project.description || "No description"}</p>
            <p>Owner: {project.owner?.email}</p>
            <p>Members: {project.members?.length ?? 0}</p>
            <form className="inline-form" onSubmit={(event) => handleAddMember(event, project.id)}>
              <input
                type="email"
                placeholder="member@example.com"
                value={memberEmails[project.id] || ""}
                onChange={(event) =>
                  setMemberEmails((current) => ({ ...current, [project.id]: event.target.value }))
                }
              />
              <button type="submit">Add member</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;
