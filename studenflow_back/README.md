# StudentFlow Back

Backend base de StudentFlow.

## Requisitos

- Node.js 22+
- MySQL disponible en `localhost:3306`

## Variables de entorno

Copiar `.env.example` a `.env` y ajustar:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=studentflow
DB_USER=studentflow_user
DB_PASSWORD=change_me
```

## Scripts

- `npm run dev`: arranque en modo desarrollo con watch
- `npm start`: arranque normal

## Endpoint inicial

- `GET /api/v1/health`(http://localhost:3000/api/v1/health)
- http://localhost:3000/api/v1/materias-->listado de materias

Si todo está bien, deberías recibir algo como:

```
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected"
  }
}
```
