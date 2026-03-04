# 🚀 Quick Start - Monitor Clínico 6MWT

## 5 Minutos para Empezar

### 1. Clonar y Instalar

```bash
# Clonar
git clone <repo-url>
cd monitor-clinico

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
```

### 2. Iniciar Aplicación

```bash
npm start
```

Abre [http://localhost:3000](http://localhost:3000)

---

## 🎯 Primeros Pasos

### Pantalla 1: Login
```
Email: cualquier@email.com
Contraseña: Demo123456!
```

O crea una cuenta nueva con:
- Nombre y Apellido
- Email único
- Contraseña: Mín 8 caracteres, mayúscula, minúscula, número, especial
- Seleccionar tipo de usuario

### Pantalla 2: Nueva Prueba

**3 opciones disponibles:**

#### A) Modo Demo (Recomendado para probar)
1. Click en tab "🧪 Modo Demo"
2. Click en "Iniciar Modo Demo"
3. Se abre vista de monitoreo con datos simulados

#### B) Datos del Paciente (Registro manual)
1. Click en tab "👤 Datos del Paciente"
2. Completar formulario:
   - Nombre paciente
   - Edad (1-120)
   - Altura (50-250 cm)
   - Sexo
   - Tipo de cirugía
   - Fecha operación
   - Observaciones (opcional)
3. Click "Iniciar Prueba"

#### C) Dispositivo (Para ESP32)
1. Click en tab "📱 Dispositivo"
2. Ingresar IP del dispositivo
3. Click "Conectar"
4. Completar datos del paciente

---

## 📁 Estructura Clave

```
src/
├── components/       # Componentes React
├── pages/           # Vistas (Login, NewTest, etc)
├── services/        # API, WebSocket, Auth
├── context/         # Estado global
├── hooks/           # Custom hooks
├── types/           # Interfaces TypeScript
├── utils/           # Funciones helper
└── constants/       # Constantes globales
```

---

## 💡 Conceptos Clave

### Context API
- **AuthContext**: Maneja login/logout
- **TestContext**: Maneja datos de pruebas
- **NotificationContext**: Sistema de notificaciones

### Servicios
- **authService**: JWT, login, register
- **apiService**: HTTP requests
- **websocketService**: Conexión tiempo real
- **testService**: CRUD de pruebas

### Hooks Personalizados
- `useAuth()` - Acceso a contexto de auth
- `useTest()` - Acceso a contexto de test
- `useForm()` - Gestión de formularios
- `useTestTimer()` - Cronómetro
- `useNotification()` - Notificaciones

---

## 🔧 Configuración

### Variables de Entorno (.env)

```env
# API del backend
REACT_APP_API_URL=http://localhost:3001/api

# WebSocket
REACT_APP_WS_URL=ws://localhost:8080

# Ambiente
REACT_APP_ENV=development
```

### Tailwind CSS
Ya está configurado. Los estilos se aplican automáticamente con clases como:
```tsx
<div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
  Botón
</div>
```

---

## 🧪 Modo Demo (Datos de Prueba)

**Paciente Demo Automático:**
```
Nombre: Juan Pérez García
Edad: 45 años
Altura: 170 cm
Cirugía: Cardíaca
Fecha Op: 2026-02-23
```

**Datos Simulados:**
- Frecuencia cardíaca: 60-140 BPM
- SpO2: 85-100%
- Pasos: Incrementan continuamente
- Distancia: Calculada automáticamente
- Duración: 6 minutos + extensible 2 min

---

## 🔐 Seguridad

El proyecto implementa:
- ✅ JWT Authentication
- ✅ Refresh tokens automáticos
- ✅ Protected routes
- ✅ Validación de inputs
- ✅ Error handling centralizado
- ✅ CORS configurado

---

## 🎨 Personalización

### Cambiar Colores
Editar en `src/constants/index.ts`:
```typescript
export const COLORS = {
  primary: '#1e40af',    // Azul
  secondary: '#059669',  // Verde
  danger: '#dc2626',     // Rojo
  warning: '#eab308',    // Amarillo
  // ...
};
```

### Agregar Componente Nuevo
```bash
# Crear carpeta
mkdir src/components/mi-componente

# Crear archivos
touch src/components/mi-componente/MiComponente.tsx
touch src/components/mi-componente/index.ts
```

```typescript
// MiComponente.tsx
export const MiComponente: React.FC = () => {
  return <div>Mi componente</div>;
};

// index.ts
export { MiComponente } from './MiComponente';
```

---

## 🐛 Debugging

### Ver Logs
```typescript
// En cualquier componente
console.log('Mi valor:', miValor);
```

### DevTools de React
1. Instalar React Developer Tools (Chrome/Firefox)
2. Abre DevTools (F12)
3. Vé a tab "Components" o "Profiler"

### TypeScript Errors
```bash
# Verificar tipos
npm run type-check
```

---

## 📚 Documentación Disponible

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura detallada
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Guía de desarrollo
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Estado actual
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Cómo contribuir

---

## ⌨️ Comandos Útiles

```bash
# Desarrollo
npm start                    # Inicia en puerto 3000

# Build
npm run build               # Crea carpeta /build

# Testing (próximamente)
npm test                    # Ejecuta tests

# Verificación
npm run type-check         # Verifica tipos TypeScript

# Linting (próximamente)
npm run lint               # Ejecuta linter
```

---

## 🚨 Troubleshooting

### "Port 3000 is already in use"
```bash
PORT=3001 npm start
```

### "Module not found"
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### "TypeScript error"
Verificar que:
1. El archivo tiene extensión `.tsx` (componentes) o `.ts` (utils)
2. Los imports están correctos
3. Las interfaces están definidas

---

## 🌐 Deployment

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

---

## 💬 Ayuda

¿Necesitas ayuda?
1. Revisa la documentación en [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Busca en los issues existentes
3. Abre un issue nuevo
4. Contacta al equipo de desarrollo

---

## ✅ Checklist Inicial

- [ ] Clonaste el repositorio
- [ ] Instalaste dependencias
- [ ] Copiaste `.env.example` a `.env`
- [ ] `npm start` funciona
- [ ] Puedes ver la página de login
- [ ] Puedes registrarte o iniciar sesión
- [ ] Puedes iniciar modo demo
- [ ] Leíste la documentación

---

## 🎉 ¡Listo!

Ahora estás listo para:
1. ✅ Explorar la aplicación
2. ✅ Entender la arquitectura
3. ✅ Empezar a desarrollar
4. ✅ Contribuir al proyecto

---

**Próximo paso**: Leer [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) para saber qué viene después.

**Happy Coding! 🚀**

