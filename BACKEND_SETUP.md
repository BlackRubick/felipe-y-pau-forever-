# 🎉 Backend API Creada - Resumen

## ✅ Lo que se ha implementado

### 📁 Estructura del Backend

```
backend/
├── src/
│   ├── index.ts              # Servidor Express principal
│   ├── types.ts              # Interfaces TypeScript
│   ├── database.ts           # Base de datos en memoria
│   ├── middleware.ts         # Autenticación JWT
│   └── routes/
│       ├── auth.ts           # Endpoints de autenticación
│       └── tests.ts          # Endpoints de pruebas
├── dist/                     # Código compilado
├── package.json              # Dependencias
├── tsconfig.json             # Configuración TypeScript
├── .env.example              # Variables de entorno
├── .gitignore                # Git ignore
└── README.md                 # Documentación API
```

---

## 🔐 Endpoints de Autenticación

### POST `/api/auth/register`
Registrar nuevo usuario
```json
{
  "nombre": "Dr. Juan",
  "email": "juan@hospital.com",
  "password": "Password123!",
  "rol": "medico",
  "institucion": "Hospital Central"
}
```

### POST `/api/auth/login`
Iniciar sesión
```json
{
  "email": "juan@hospital.com",
  "password": "Password123!"
}
```

### POST `/api/auth/refresh`
Refrescar token JWT

### GET `/api/auth/me`
Obtener perfil del usuario (requiere token)

---

## 🧪 Endpoints de Pruebas

### POST `/api/tests`
Crear nueva prueba 6MWT

### GET `/api/tests`
Listar todas las pruebas (datos para Historial)

### GET `/api/tests/{id}`
Obtener detalles de una prueba (datos para Reportes)

### POST `/api/tests/{id}/readings`
Agregar lectura de vitales (durante monitoreo)

### POST `/api/tests/{id}/alerts`
Agregar alerta clínica (durante monitoreo)

### PUT `/api/tests/{id}`
Actualizar datos de la prueba

### PUT `/api/tests/{id}/finalize`
Finalizar prueba (calcular promedios)

### DELETE `/api/tests/{id}`
Cancelar prueba

---

## 👥 Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| juan@hospital.com | Password123! | Médico |
| maria@hospital.com | Password123! | Médico |
| admin@hospital.com | Admin123! | Admin |

---

## 🚀 Cómo ejecutar

### Backend

```bash
# 1. Entrar a la carpeta backend
cd backend

# 2. Instalar dependencias (primera vez)
npm install

# 3. Copiar variables de entorno
cp .env.example .env

# 4. Ejecutar en desarrollo
npm run dev
```

El servidor estará disponible en: **http://localhost:3001**

### Frontend (en otra terminal)

```bash
# Desde la raíz del proyecto
npm start
```

El frontend estará disponible en: **http://localhost:3000**

---

## 📊 Base de Datos

Actualmente la base de datos está **en memoria**, lo que significa:
- ✅ Datos de ejemplo preactivados
- ✅ Perfecto para desarrollo
- ❌ Se pierden al reiniciar el servidor
- ❌ No persiste en disco

**Para producción** se recomienda:
- MongoDB
- PostgreSQL
- Firebase

---

## 🔒 Autenticación

Todos los endpoints (excepto `/auth/register` y `/auth/login`) requieren:

```
Authorization: Bearer <token>
```

El token es un JWT que expira en 24 horas.

---

## 📝 Ejemplo de Flujo Completo

### 1. Registrar o Login
```bash
POST /api/auth/login
{
  "email": "juan@hospital.com",
  "password": "Password123!"
}

# Respuesta:
{
  "token": "eyJhbGc...",
  "user": {...}
}
```

### 2. Crear prueba
```bash
POST /api/tests
Authorization: Bearer eyJhbGc...
{
  "paciente": {...},
  "medicoResponsable": "Dr. Juan García",
  "enfermedadPulmonar": "EPOC"
}

# Respuesta:
{
  "id": "test-abc123",
  "estado": "en_progreso"
}
```

### 3. Agregar lecturas (durante test)
```bash
POST /api/tests/test-abc123/readings
Authorization: Bearer eyJhbGc...
{
  "frecuenciaCardiaca": 95,
  "spo2": 96,
  "pasos": 50,
  "distancia": 250
}
```

### 4. Finalizar prueba
```bash
PUT /api/tests/test-abc123/finalize
Authorization: Bearer eyJhbGc...

# Respuesta:
{
  "id": "test-abc123",
  "estado": "completada",
  "fcPromedio": 95,
  "spo2Promedio": 96,
  "distanciaTotal": 542
}
```

### 5. Obtener reporte (vista Reportes)
```bash
GET /api/tests/test-abc123
Authorization: Bearer eyJhbGc...

# Retorna datos para mostrar en ReportesPage
```

### 6. Listar historial (vista Historial)
```bash
GET /api/tests
Authorization: Bearer eyJhbGc...

# Retorna array de todas las pruebas
```

---

## 🎯 Próximas Fases

### Fase 1: Conectar Frontend a API
- [ ] Actualizar `apiService.ts` para usar endpoints reales
- [ ] Actualizar contextos para hacer llamadas a API
- [ ] Probar flujo completo

### Fase 2: Monitoreo en Tiempo Real
- [ ] Crear página `/monitoreo`
- [ ] Integrar WebSocket para datos en vivo
- [ ] Mostrar gráficos en tiempo real

### Fase 3: Base de Datos Persistente
- [ ] Cambiar de memoria a MongoDB/PostgreSQL
- [ ] Implementar modelos
- [ ] Migraciones

### Fase 4: Deploy
- [ ] Backend a Heroku/Railway/Render
- [ ] Frontend a Vercel/Netlify
- [ ] Configurar variables de entorno

---

## 📚 Archivos de Referencia

- **API Docs**: `backend/README.md`
- **Setup Local**: `RUN_LOCAL.md`
- **Arquitectura General**: `ARCHITECTURE.md`
- **Frontend Setup**: `QUICKSTART.md`

---

## 🎉 ¡Listo para usar!

```bash
# Terminal 1 - Backend
cd backend && npm install && npm run dev

# Terminal 2 - Frontend  
npm start

# Abrir navegador
http://localhost:3000
```

**Usuarios de prueba:**
- Email: `juan@hospital.com` | Contraseña: `Password123!`
