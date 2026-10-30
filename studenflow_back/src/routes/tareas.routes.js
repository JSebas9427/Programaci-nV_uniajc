
import { Router } from "express";
import {
  createTarea,
  deleteTarea,
  getTarea,
  listTareas,
  replaceTarea,
  updateTarea
} from "../controllers/tareas.controller.js";

const router = Router();

router.get("/", listTareas);
router.get("/:id", getTarea);
router.post("/", createTarea);
router.put("/:id", replaceTarea);
router.patch("/:id", updateTarea);
router.delete("/:id", deleteTarea);

export default router;
