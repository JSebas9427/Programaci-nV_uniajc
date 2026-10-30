import { Router } from "express";
import {
  createMateria,
  deleteMateria,
  getMateria,
  listMaterias,
  replaceMateria,
  updateMateria
} from "../controllers/materias.controller.js";

const router = Router();

router.get("/", listMaterias);
router.get("/:id", getMateria);
router.post("/", createMateria);
router.put("/:id", replaceMateria);
router.patch("/:id", updateMateria);
router.delete("/:id", deleteMateria);

export default router;
