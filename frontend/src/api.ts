const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

const getToken = () => localStorage.getItem("ttm_token");

const headers = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const request = async (path: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers(),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { error: data.error || "Request failed" };
  }

  return data;
};

export const api = {
  post: async (path: string, body: unknown) => {
    return request(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  get: async (path: string) => {
    return request(path);
  },
  patch: async (path: string, body: unknown) => {
    return request(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
};

export const auth = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),
  signup: (email: string, password: string, name?: string, role?: string) =>
    api.post("/auth/signup", { email, password, name, role }),
};

export const projectApi = {
  list: () => api.get("/projects"),
  create: (name: string, description?: string) => api.post("/projects", { name, description }),
  addMember: (projectId: string, email: string) => api.post(`/projects/${projectId}/members`, { email }),
};

export const taskApi = {
  list: () => api.get("/tasks"),
  create: (projectId: string, title: string, description?: string, assigneeEmail?: string, dueDate?: string) =>
    api.post("/tasks", { projectId, title, description, assigneeEmail, dueDate }),
  updateStatus: (taskId: string, status: string) => api.patch(`/tasks/${taskId}`, { status }),
};
