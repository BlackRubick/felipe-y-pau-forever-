# 🚀 Ejecutar Frontend + Backend

## Opción 1: Ejecutar en dos terminales (Recomendado)

### Terminal 1 - Backend
```bash
cd backend
npm install        # Primera vez
npm run dev       # Inicia en puerto 3001
```

### Terminal 2 - Frontend
```bash
npm install        # Primera vez
npm start         # Inicia en puerto 3000
```

## Opción 2: Ejecutar ambos con npm-run-all

```bash
npm install -D npm-run-all

# En package.json (raíz), agregar:
"scripts": {
  "dev": "npm-run-all --parallel dev:frontend dev:backend",
  "dev:frontend": "react-scripts start",
  "dev:backend": "cd backend && npm run dev"
}

# Luego ejecutar:
npm run dev
```

---

## ✅ Verificar que todo funciona

### API Health Check
```bash
curl http://localhost:3001/api/health
```

Respuesta esperada:
```json
{"status":"OK","message":"API is running"}
```

### Login de prueba
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@hospital.com",
    "password": "Password123!"
  }'
```

### Frontend
Abrir en navegador: http://localhost:3000

Credenciales de prueba:
- Email: `juan@hospital.com`
- Contraseña: `Password123!`

---

## 🔧 Configurar Frontend para usar API

El archivo `.env` del frontend ya contiene:
```
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:8080
```

Si necesitas cambiar el puerto de la API, actualiza `src/services/apiService.ts`.

---

## 🐛 Troubleshooting

### Error: "Port 3001 already in use"
```bash
# Cambiar puerto en backend/.env
PORT=3002 npm run dev
```

### Error: "CORS error"
Verificar que `CORS_ORIGIN` en `backend/.env` sea correcto:
```env
CORS_ORIGIN=http://localhost:3000
```

### Error: "Cannot find module..."
```bash
cd backend
npm install
npm run build
npm run dev
```

---

## 📚 Documentación

- Frontend: Ver [QUICKSTART.md](./QUICKSTART.md)
- Backend: Ver [backend/README.md](./backend/README.md)
- Arquitectura: Ver [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 🎯 Próximos Pasos

1. ✅ Backend API creada
2. ⏳ Conectar frontend a API real
3. ⏳ Integración WebSocket para monitoreo en tiempo real
4. ⏳ Base de datos persistente (MongoDB/PostgreSQL)
5. ⏳ Tests unitarios
6. ⏳ Deploy a producción
