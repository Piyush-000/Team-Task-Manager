import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import prisma from "../lib/prisma";
// import { Role, TaskStatus } from "@prisma/client";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

type TaskBody = {
  projectId?: string;
  title?: string;
  description?: string;
  assigneeEmail?: string;
  dueDate?: string;
};

type TaskStatusBody = {
  status?: string;
};

const ensureProjectAccess = async (userId: string, projectId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });
  if (!project) return null;
  const isOwner = project.ownerId === userId;
  const membership = project.members.find((member: { userId: string; role: string }) => member.userId === userId);
  const isAdminMember = membership?.role === "ADMIN";
  const isMember = Boolean(membership);
  return { project, canManage: isOwner || isAdminMember, hasAccess: isOwner || isMember };
};

router.get("/", asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: req.user.id },
          { project: { ownerId: req.user.id } },
          { project: { members: { some: { userId: req.user.id } } } },
        ],
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, email: true, name: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    res.json({ tasks });
  } catch (error) {
    next(error);
  }
}));

router.post("/", asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { projectId, title, description, assigneeEmail, dueDate } = req.body as TaskBody;
    if (!projectId || !title) {
      res.status(400).json({ error: "Project and title are required" });
      return;
    }

    const access = await ensureProjectAccess(req.user.id, projectId);
    if (!access || !access.canManage) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (req.user.role !== "ADMIN") {
      res.status(403).json({ error: "Only admins can create tasks" });
      return;
    }

    const normalizedAssigneeEmail = assigneeEmail?.trim().toLowerCase();
    const assignee = assigneeEmail
      ? await prisma.user.findUnique({ where: { email: normalizedAssigneeEmail } })
      : null;
    if (assigneeEmail && !assignee) {
      res.status(404).json({ error: "Assignee user not found" });
      return;
    }
    if (assignee) {
      const canAssign =
        assignee.id === access.project.ownerId ||
        access.project.members.some((member: { userId: string; role: string }) => member.userId === assignee.id);
      if (!canAssign) {
        res.status(400).json({ error: "Assignee must belong to the project" });
        return;
      }
    }
    const parsedDueDate = dueDate ? new Date(dueDate) : null;
    if (parsedDueDate && Number.isNaN(parsedDueDate.getTime())) {
      res.status(400).json({ error: "Due date is invalid" });
      return;
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: parsedDueDate,
        projectId,
        assigneeId: assignee?.id,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, email: true, name: true } },
      },
    });

    res.json({ task });
  } catch (error) {
    next(error);
  }
}));

router.patch("/:taskId", asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { taskId } = req.params;
    const { status } = req.body as TaskStatusBody;
    if (!status || !["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
      res.status(400).json({ error: "Valid status is required" });
      return;
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const access = await ensureProjectAccess(req.user.id, task.projectId);
    if (!access || !access.hasAccess) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status: status as any },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, email: true, name: true } },
      },
    });

    res.json({ task: updated });
  } catch (error) {
    next(error);
  }
}));

export default router;
