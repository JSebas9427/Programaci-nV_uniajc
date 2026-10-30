import { checkDatabaseConnection } from "../config/database.js";

export async function getHealth(_request, response, next) {
  try {
    await checkDatabaseConnection();

    response.status(200).json({
      success: true,
      data: {
        status: "ok",
        database: "connected"
      }
    });
  } catch (error) {
    next(error);
  }
}
