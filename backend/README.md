# 🏥 Monitor Clínico - Backend API

API Node.js con Express para el Sistema de Monitoreo Clínico 6MWT.

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env`:
```env
PORT=3001
JWT_SECRET=tu_secreto_jwt_super_seguro_aqui_2026
JWT_REFRESH_SECRET=tu_secreto_refresh_jwt_super_seguro_aqui_2026
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

### 4. Compilar para producción

```bash
npm run build
npm start
```

## 📚 Endpoints

### 🔐 Autenticación (`/api/auth`)

#### Registrar usuario
```bash
POST /api/auth/register
Content-Type: application/json

{
  "nombre": "Dr. Juan García",
  "email": "juan@hospital.com",
  "password": "Password123!",
  "rol": "medico",
  "institucion": "Hospital Central"
}
```

**Respuesta (201):**
```json
{
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "user-1",
    "nombre": "Dr. Juan García",
    "email": "juan@hospital.com",
    "rol": "medico",
    "institucion": "Hospital Central",
    "createdAt": "2026-03-04T10:00:00.000Z"
  }
}
```

#### Iniciar sesión
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@hospital.com",
  "password": "Password123!"
}
```

**Usuarios de prueba:**
- Email: `juan@hospital.com` | Password: `Password123!` (Médico)
- Email: `maria@hospital.com` | Password: `Password123!` (Médico)
- Email: `admin@hospital.com` | Password: `Admin123!` (Admin)

#### Refrescar token
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

#### Obtener perfil actual
```bash
GET /api/auth/me
Authorization: Bearer <token>
```

---

### 🧪 Pruebas (`/api/tests`)

#### Crear prueba
```bash
POST /api/tests
Authorization: Bearer <token>
Content-Type: application/json

{
  "paciente": {
    "id": "pac-123",
    "nombreCompleto": "Juan Pérez García",
    "edad": 45,
    "altura": 170,
    "peso": 75,
    "sexo": "M",
    "raza": "Latina"
  },
  "medicoResponsable": "Dr. Juan García",
  "enfermedadPulmonar": "EPOC",
  "numeroCaminata": 1,
  "fechaCaminata": "2026-03-04",
  "presionSanguineaInicial": "135/85",
  "oxigenoSupplementario": false,
  "observacionesPrevias": "Paciente en buen estado"
}
```

**Respuesta (201):**
```json
{
  "id": "test-abc12345",
  "paciente": {...},
  "medicoResponsable": "Dr. Juan García",
  "fecha": "2026-03-04T10:00:00.000Z",
  "estado": "en_progreso",
  "duracion": 0,
  "distanciaTotal": 0,
  "fcPromedio": 0,
  "spo2Promedio": 0,
  "alertas": [],
  "lecturas": []
}
```

#### Listar todas las pruebas
```bash
GET /api/tests
Authorization: Bearer <token>
```

#### Obtener prueba por ID
```bash
GET /api/tests/{testId}
Authorization: Bearer <token>
```

#### Agregar lectura a prueba
```bash
POST /api/tests/{testId}/readings
Authorization: Bearer <token>
Content-Type: application/json

{
  "frecuenciaCardiaca": 95,
  "spo2": 96,
  "pasos": 50,
  "distancia": 250
}
```

#### Agregar alerta a prueba
```bash
POST /api/tests/{testId}/alerts
Authorization: Bearer <token>
Content-Type: application/json

{
  "tipo": "spo2_baja",
  "severidad": "critical",
  "valor": 85,
  "mensaje": "SpO2 por debajo de 90%"
}
```

#### Actualizar prueba
```bash
PUT /api/tests/{testId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "estado": "en_progreso",
  "duracion": 180,
  "distanciaTotal": 450,
  "fcPromedio": 92,
  "spo2Promedio": 96,
  "observaciones": "Prueba en curso"
}
```

#### Finalizar prueba
```bash
PUT /api/tests/{testId}/finalize
Authorization: Bearer <token>
```

#### Cancelar prueba
```bash
DELETE /api/tests/{testId}
Authorization: Bearer <token>
```

---

## 🗄️ Estructura

```
backend/
├── src/
│   ├── index.ts           # Punto de entrada
│   ├── types.ts           # Interfaces TypeScript
│   ├── database.ts        # Base de datos en memoria
│   ├── middleware.ts      # Middlewares (auth)
│   └── routes/
│       ├── auth.ts        # Rutas de autenticación
│       └── tests.ts       # Rutas de pruebas
├── dist/                  # Build compilado
├── package.json
├── tsconfig.json
└── .env.example
```

## 🔑 Tipos de Usuarios

- **Admin**: Acceso total a la API
- **Médico**: Puede crear y gestionar pruebas
- **Enfermero**: Acceso limitado (lectura)

## 🔒 Autenticación

Todos los endpoints excepto `/auth/register` y `/auth/login` requieren token JWT.

**Header requerido:**
```
Authorization: Bearer <token>
```

## 📊 Datos de Ejemplo

La base de datos viene pre-poblada con:

**Usuarios:**
- Dr. Juan García (juan@hospital.com)
- Dra. María López (maria@hospital.com)
- Admin User (admin@hospital.com)

**Pruebas:**
- 2 pruebas completadas de ejemplo

## 🚨 Códigos de Error

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 📝 Notas

- Base de datos en memoria (se reinicia al reiniciar servidor)
- Para producción, implementar MongoDB o PostgreSQL
- Los tokens JWT expiran en 24 horas
- Los refresh tokens expiran en 7 días

## 🚀 Deploy a Producción

```bash
npm run build
npm start
```

Con variables de entorno configuradas:
```bash
PORT=3001 \
JWT_SECRET=<tu_secreto> \
JWT_REFRESH_SECRET=<tu_secreto> \
CORS_ORIGIN=https://tudominio.com \
NODE_ENV=production \
npm start
```

## 📞 Soporte

Para errores o problemas, revisar los logs del servidor.
