#!/bin/bash

# Script para iniciar el Monitor Clínico
# Frontend + Backend

echo "🚀 Iniciando Monitor Clínico..."
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar si node_modules existe en el backend
if [ ! -d "backend/node_modules" ]; then
    echo -e "${BLUE}📦 Instalando dependencias del backend...${NC}"
    cd backend && npm install && cd ..
fi

# Verificar si node_modules existe en el frontend
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Instalando dependencias del frontend...${NC}"
    npm install
fi

# Compilar el backend
echo -e "${BLUE}🔨 Compilando backend...${NC}"
cd backend && npm run build && cd ..

# Iniciar el backend en background
echo -e "${GREEN}🚀 Iniciando backend en http://localhost:3001${NC}"
cd backend && npm start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Esperar a que el backend esté listo
sleep 3

# Iniciar el frontend
echo -e "${GREEN}🚀 Iniciando frontend en http://localhost:3000${NC}"
echo ""
echo -e "${GREEN}✅ Sistema listo!${NC}"
echo ""
echo "📝 Credenciales de acceso:"
echo "   Email: admin@hotmail.com"
echo "   Password: admin123"
echo ""
echo "💡 Para detener el backend: kill $BACKEND_PID"
echo ""

npm start

# Al cerrar el frontend, matar el backend
kill $BACKEND_PID 2>/dev/null
