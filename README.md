# 🏥 Monitor Clínico 6MWT

**Sistema de Monitoreo Clínico en Tiempo Real para Pruebas de Caminata de 6 Minutos (6MWT)**

Aplicación web full-stack responsiva para registrar, monitorear, analizar y reportar pruebas de caminata de 6 minutos con datos en tiempo real. Diseñada para pacientes post-quirúrgicos, personal médico y hospitales.

[![React](https://img.shields.io/badge/React-18.2.0-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.3-blue?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📋 Características

### ✨ Vistas Implementadas

1. **🔐 Autenticación (Completada)**
   - Login con email/contraseña
   - Registro de nuevos usuarios
   - Recuperación de contraseña
   - JWT con tokens de renovación
   - Roles y permisos

2. **🆕 Nueva Prueba (Completada)**
   - Formulario de datos del paciente
   - Modo demo con datos simulados
   - Panel de conexión a dispositivo
   - Validaciones integradas
   - Interfaz multi-tab

3. **⏱️ Monitoreo en Tiempo Real (Próximamente)**
   - Conexión WebSocket a dispositivo
   - Gráficos dinámicos (FC, SpO2)
   - Tabla de lecturas en tiempo real
   - Alertas clínicas automáticas
   - Cronómetro preciso
   - Pausa/Reanudar/Finalizar

4. **📊 Reportes (Próximamente)**
   - Cálculo automático de estadísticas
   - Gráficos de resultados
   - Interpretación clínica automática
   - Exportación a PDF y CSV
   - Notas clínicas

5. **📚 Historial (Próximamente)**
   - Tabla de pruebas realizadas
   - Filtros y búsqueda avanzada
   - Comparación entre pruebas
   - Análisis estadístico general
   - Exportación masiva

6. **⚙️ Perfil y Configuración (Próximamente)**
   - Edición de perfil
   - Cambio de contraseña
   - Preferencias de aplicación
   - Gestión de privacidad (GDPR)
   - Gestión de sesiones

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18.2+** - Librería UI
- **TypeScript** - Type safety
- **React Router v6** - Navegación
- **Tailwind CSS** - Estilos responsivos
- **Context API** - Estado global
- **Recharts** - Gráficos (próximamente)

### Servicios
- **JWT Authentication** - Autenticación segura
- **WebSocket** - Comunicación tiempo real
- **REST API** - Comunicación con backend

### Herramientas
- **jsPDF** - Generación de PDF
- **PapaParse** - Exportación CSV
- **date-fns** - Formateo de fechas

---

## 🏛️ Arquitectura Limpia

El proyecto sigue principios de **Clean Architecture** con:

- **Separación de responsabilidades**: Componentes → Hooks → Servicios → API
- **Type-safe**: TypeScript en toda la aplicación
- **Reutilización**: Custom hooks y componentes
- **Mantenibilidad**: Código organizado y documentado
- **Testing**: Preparado para Jest y React Testing Library

Para más detalles, ver [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 📁 Estructura del Proyecto

```
src/
├── components/        # Componentes React reutilizables
│   ├── common/       # Botones, inputs, cards, etc
│   ├── auth/         # Componentes de autenticación
│   └── monitoring/   # Componentes de monitoreo
├── context/          # Context API (Auth, Test, Notificaciones)
├── hooks/            # Custom hooks reutilizables
├── pages/            # Páginas principales
├── services/         # API, WebSocket, Auth services
├── types/            # Interfaces TypeScript
├── utils/            # Funciones helper
├── constants/        # Constantes de la app
└── styles/           # Estilos globales
```

---

## 🚀 Guía Rápida de Inicio

### Requisitos
- Node.js 16+ 
- npm o yarn

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repo>
   cd monitor-clinico
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Crear archivo .env en la raíz
   echo "REACT_APP_API_URL=http://localhost:3001/api" > .env
   echo "REACT_APP_WS_URL=ws://localhost:8080" >> .env
   ```

4. **Iniciar servidor de desarrollo**
   ```bash
   npm start
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador

### Credenciales de Prueba

```
Email: doctor@example.com
Contraseña: Demo123456!
```

---

## 📊 Pantallas Principales

### Login
```
Autenticación segura con email/contraseña
Recuperación de contraseña
Registro de nuevos usuarios
```

### Nueva Prueba
```
3 modos:
1. Modo Demo - Datos simulados
2. Dispositivo - Conexión WebSocket a ESP32
3. Datos del Paciente - Registro manual
```

### Monitoreo (en desarrollo)
```
- Cronómetro en tiempo real
- 4 tarjetas de métricas (FC, SpO2, pasos, distancia)
- Gráficos dinámicos
- Tabla de lecturas
- Alertas clínicas
- Controles de pausa/finalización
```

---

## 🔐 Seguridad

- ✅ **HTTPS recomendado** en producción
- ✅ **JWT Tokens** con refresh automático
- ✅ **Contraseñas hasheadas** (bcrypt)
- ✅ **Validación de inputs** en cliente y servidor
- ✅ **CORS configurado**
- ✅ **Rate limiting** en API
- ✅ **Roles y permisos** implementados

---

## 📱 Responsividad

- ✅ Mobile-first design
- ✅ Breakpoints: 320px, 640px, 768px, 1024px, 1280px+
- ✅ Sidebar colapsable en mobile
- ✅ Gráficos responsive
- ✅ Tablas adaptables

---

## 🧪 Modo Demo

La aplicación incluye un modo demo que genera datos realistas:

```typescript
// Paciente demo
- Nombre: Juan Pérez García
- Edad: 45 años
- Altura: 170 cm
- Cirugía: Cardíaca
- Datos: Simulados en tiempo real
```

Perfecto para probar todas las funcionalidades sin dispositivo.

---

## 📈 Próximas Implementaciones

### Fase 1: Monitoreo en Tiempo Real
- [x] Estructura base
- [ ] Conexión WebSocket
- [ ] Gráficos dinámicos
- [ ] Alertas en tiempo real
- [ ] Tabla de lecturas

### Fase 2: Reportes
- [ ] Cálculo de estadísticas
- [ ] Gráficos de resultados
- [ ] Exportación PDF/CSV
- [ ] Interpretación automática

### Fase 3: Historial
- [ ] Tabla de pruebas
- [ ] Filtros avanzados
- [ ] Comparación de pruebas
- [ ] Análisis estadístico

### Fase 4: Perfil y Configuración
- [ ] Edición de perfil
- [ ] Preferencias de app
- [ ] GDPR compliance
- [ ] Tema oscuro

---

## 📖 Documentación

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Arquitectura limpia y patrones
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Guía detallada de implementación
- **[API_SPEC.md](API_SPEC.md)** - (próximamente) Especificación de API
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - (próximamente) Guía de contribución

---

## 🐛 Troubleshooting

### Puerto 3000 en uso
```bash
PORT=3001 npm start
```

### Limpiar dependencias
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
npm run type-check
```

---

## 📦 Scripts Disponibles

```bash
npm start          # Inicia desarrollo en puerto 3000
npm run build      # Construye para producción
npm test           # Ejecuta tests
npm run lint       # Ejecuta linter
npm run type-check # Verifica tipos TypeScript
npm run format     # Formatea código
```

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo licencia MIT. Ver archivo [LICENSE](LICENSE) para más detalles.

---

## 👥 Autor

Desarrollado como un sistema completo de monitoreo clínico.

**Versión**: 1.0.0  
**Última actualización**: 2 de marzo de 2026

---

## 📞 Soporte

Para preguntas o problemas:
- Abre un issue en GitHub
- Contacta al equipo de desarrollo
- Consulta la documentación

---

## 🙏 Agradecimientos

- React y la comunidad JavaScript
- Tailwind CSS por los estilos
- Recharts por los gráficos
- Todos los contribuidores

---

**⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub**
