import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import prisma from "../lib/prisma";
// Define Role enum manually since @prisma/client does not export it
enum Role {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER"
}
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

type ProjectBody = {
  name?: string;
  description?: string;
};

type MemberBody = {
  email?: string;
};

const ensureProjectAccess = async (userId: string, projectId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });
  if (!project) {
    return null;
  }
  const isOwner = project.ownerId === userId;
  const isMember = project.members.some((member: { userId: string }) => member.userId === userId);
  return { project, canManage: isOwner, hasAccess: isOwner || isMember };
};

router.get("/", asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, email: true, name: true } },
        members: { include: { user: { select: { id: true, email: true, name: true } } } },
      },
    });

    res.json({ projects });
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
    if (req.user.role !== Role.ADMIN) {
      res.status(403).json({ error: "Only admins can create projects" });
      return;
    }
    const { name, description } = req.body as ProjectBody;
    if (!name) {
      res.status(400).json({ error: "Project name is required" });
      return;
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id, role: Role.ADMIN },
        },
      },
      include: {
        owner: { select: { id: true, email: true, name: true } },
        members: { include: { user: { select: { id: true, email: true, name: true } } } },
      },
    });

    res.json({ project });
  } catch (error) {
    next(error);
  }
}));

router.post(
  "/:projectId/members",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { projectId } = req.params;
      const { email } = req.body as MemberBody;
      if (!email) {
        res.status(400).json({ error: "Member email is required" });
        return;
      }

      const access = await ensureProjectAccess(req.user.id, projectId);
      if (!access || !access.canManage) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      if (req.user.role !== Role.ADMIN) {
        res.status(403).json({ error: "Only admins can add project members" });
        return;
      }

      const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      if (user.id === access.project.ownerId) {
        res.status(400).json({ error: "Project owner is already an admin member" });
        return;
      }

      const membership = await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId, userId: user.id } },
        update: {},
        create: { projectId, userId: user.id, role: Role.MEMBER },
        include: { user: { select: { id: true, email: true, name: true } } },
      });

      res.json({ membership });
    } catch (error) {
      next(error);
    }
  })
);

router.get("/:projectId", asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { projectId } = req.params;
    const access = await ensureProjectAccess(req.user.id, projectId);
    if (!access || !access.hasAccess) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.json({ project: access.project });
  } catch (error) {
    next(error);
  }
}));

export default router;
