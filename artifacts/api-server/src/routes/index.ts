import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import tasksRouter from "./tasks";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/projects", projectsRouter);
router.use("/tasks", tasksRouter);
router.use("/dashboard", dashboardRouter);

export default router;
