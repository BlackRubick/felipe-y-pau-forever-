# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a Monitor Clínico 6MWT! Este documento te guiará a través del proceso de contribución.

---

## 📋 Tabla de Contenidos

1. [Requisitos](#requisitos)
2. [Configuración del Desarrollo](#configuración-del-desarrollo)
3. [Flujo de Contribución](#flujo-de-contribución)
4. [Estándares de Código](#estándares-de-código)
5. [Convenciones de Commits](#convenciones-de-commits)
6. [Pull Request Process](#pull-request-process)
7. [Reporting de Bugs](#reporting-de-bugs)
8. [Requests de Features](#requests-de-features)

---

## 🔧 Requisitos

- Node.js 16+
- npm o yarn
- Git
- Editor de texto (VS Code recomendado)
- Conocimiento básico de React y TypeScript

---

## 🚀 Configuración del Desarrollo

### 1. Fork el repositorio

```bash
# Ir a GitHub y hacer fork del proyecto
```

### 2. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/monitor-clinico.git
cd monitor-clinico
```

### 3. Agregar upstream

```bash
git remote add upstream https://github.com/original-repo/monitor-clinico.git
```

### 4. Instalar dependencias

```bash
npm install
```

### 5. Crear archivo .env

```bash
cp .env.example .env
# Editar .env con tu configuración local
```

### 6. Iniciar desarrollo

```bash
npm start
```

---

## 🔄 Flujo de Contribución

### Paso 1: Crear rama feature

```bash
# Actualizar main
git checkout main
git pull upstream main

# Crear rama con nombre descriptivo
git checkout -b feature/nombre-descriptivo
# o para bugs:
git checkout -b fix/nombre-del-bug
```

### Paso 2: Hacer cambios

```bash
# Editar archivos
# Mantener cambios pequeños y enfocados

# Ver cambios
git status
```

### Paso 3: Commit

```bash
# Hacer commit con mensaje descriptivo
git add .
git commit -m "feat: descripción clara del cambio"
```

### Paso 4: Push

```bash
git push origin feature/nombre-descriptivo
```

### Paso 5: Crear Pull Request

- Ir a GitHub
- Hacer click en "New Pull Request"
- Seleccionar tu rama
- Agregar descripción clara
- Incluir referencias a issues si aplica

---

## 📝 Estándares de Código

### TypeScript

```typescript
// ✅ BIEN
interface UserProps {
  name: string;
  email: string;
  age: number;
}

const User: React.FC<UserProps> = ({ name, email, age }) => {
  return <div>{name}</div>;
};

// ❌ MAL
const User = (props) => {
  return <div>{props.name}</div>;
};
```

### Componentes React

```typescript
// ✅ BIEN - Componentes funcionales con tipos
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  children,
  ...props
}) => {
  return <button className={`btn-${variant}`}>{children}</button>;
};

// ❌ MAL - Sin tipos, componentes de clase
class Button extends React.Component {
  render() {
    return <button>{this.props.children}</button>;
  }
}
```

### Estilos

```typescript
// ✅ BIEN - Tailwind CSS
<div className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
  Botón
</div>

// ❌ MAL - Inline styles
<div style={{ backgroundColor: 'blue', color: 'white' }}>
  Botón
</div>
```

### Imports

```typescript
// ✅ BIEN - Ordenados y específicos
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/common';
import { formatDate } from '../../utils/formatting';
import { TEST_DURATION } from '../../constants';

// ❌ MAL - Sin orden
import { TEST_DURATION } from '../../constants';
import React from 'react';
import { Button } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
```

---

## 📌 Convenciones de Commits

Usar formato: `type(scope): description`

### Tipos de commits

- **feat**: Nueva funcionalidad
- **fix**: Corrección de bug
- **docs**: Cambios en documentación
- **style**: Cambios de formato (no afectan el código)
- **refactor**: Refactorización de código
- **perf**: Mejoras de performance
- **test**: Agregación de tests
- **chore**: Cambios en build, dependencias, etc

### Ejemplos

```bash
# Feature nueva
git commit -m "feat(auth): agregar login con email"

# Fix de bug
git commit -m "fix(monitoring): corregir cálculo de FC"

# Documentación
git commit -m "docs(readme): actualizar guía de instalación"

# Refactorización
git commit -m "refactor(components): simplificar Button component"

# Cambios de estilo
git commit -m "style: aplicar Prettier al código"
```

---

## 🔀 Pull Request Process

### Requisitos antes de PR

- [ ] Los cambios están basados en la rama `main` actualizada
- [ ] El código sigue los estándares de la proyecto
- [ ] Los cambios están bien testados (si aplica)
- [ ] La documentación está actualizada
- [ ] Los commits tienen mensajes descriptivos
- [ ] No hay conflictos con `main`

### Template de PR

```markdown
## Descripción

Breve descripción de los cambios realizados.

## Tipo de Cambio

- [ ] Bug fix
- [ ] Nueva feature
- [ ] Breaking change
- [ ] Cambio en documentación

## Related Issues

Cierra #(número del issue)

## Cambios

- Lista de cambios
- Realizados en este PR

## Testing

Describe cómo testeaste los cambios

## Screenshots (si aplica)

Incluir screenshots de la UI si es relevante

## Checklist

- [ ] Mi código sigue los estándares del proyecto
- [ ] He testado mi código localmente
- [ ] He actualizado la documentación si es necesario
- [ ] No hay warnings nuevos
- [ ] Los tests pasan localmente
```

---

## 🐛 Reporting de Bugs

### Antes de reportar

- Verificar que no existe un issue similar
- Probar en la rama `main` más reciente
- Incluir versión de Node.js y npm

### Plantilla de Bug Report

```markdown
## Descripción del Bug

Descripción clara de lo que sucede

## Pasos para Reproducir

1. Ir a ...
2. Hacer click en ...
3. Ver el error

## Comportamiento Esperado

Qué debería pasar

## Comportamiento Actual

Qué está pasando

## Screenshots/Videos

Incluir si es posible

## Ambiente

- OS: Windows/Mac/Linux
- Browser: Chrome/Firefox/Safari
- Node: v16.x
- npm: v8.x

## Logs

```
Incluir logs de consola si están disponibles
```
```

---

## 💡 Requests de Features

### Plantilla de Feature Request

```markdown
## Descripción

Descripción clara de la feature deseada

## Problema que Resuelve

Qué problema intenta resolver

## Solución Propuesta

Cómo debería funcionar

## Alternativas Consideradas

Otras soluciones consideradas

## Contexto Adicional

Información extra relevante

## Impacto

Cómo afecta al usuario
```

---

## ✅ Checklist para Mantenedores

- [ ] PR tiene descripción clara
- [ ] Los cambios están enfocados
- [ ] El código sigue los estándares
- [ ] Tests pasan
- [ ] Documentación está actualizada
- [ ] No hay cambios sin revisar

---

## 🚀 Deployment

El proyecto usa Vercel para deployment automático:

- PRs: Preview automático
- main: Production automático

---

## 📚 Recursos Útiles

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Git Workflow](https://guides.github.com/introduction/flow/)

---

## ❓ Preguntas?

- Abre un issue en GitHub
- Contacta a los mantenedores
- Únete a nuestra comunidad

---

## 📝 Licencia

Al contribuir, aceptas que tus contribuciones se licencien bajo la MIT License.

---

**¡Gracias por contribuir! 🎉**

