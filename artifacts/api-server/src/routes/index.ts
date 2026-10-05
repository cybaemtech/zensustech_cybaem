import { Router, type IRouter } from "express";
import healthRouter from "./health";
import azureRouter from "./azure";
import costRouter from "./cost";

const router: IRouter = Router();

router.use(healthRouter);
router.use(azureRouter);
router.use(costRouter);

export default router;
