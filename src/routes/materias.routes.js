import { Router } from "express";
import { listMaterias, getMaterias, createMateria, getTareasByMateria, getEventosByMateria } from "../controllers/materias.controller.js";
const router = Router()

router.get("/", listMaterias);
router.get("/:id" , getMaterias);
router.post("/", createMateria);
router.get("/:id/tareas", getTareasByMateria);
router.get("/:id/eventos", getEventosByMateria);



export default router;
