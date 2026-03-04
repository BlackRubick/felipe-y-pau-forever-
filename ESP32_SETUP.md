# Configuración ESP32 Monitor Clínico

## Requisitos Previos

1. **Arduino IDE** instalado
2. **Librerías requeridas**:
   - Adafruit GFX Library
   - Adafruit SSD1306
   - MAX30105 Library
   - Adafruit MPU6050
   - ArduinoJson (v6.x)
   - WiFi (incluida en ESP32)
   - HTTPClient (incluida en ESP32)

## Instalación de Librerías

En Arduino IDE → Sketch → Include Library → Manage Libraries, instala:

```
- Adafruit GFX Library
- Adafruit SSD1306
- sparkfun MAX30105 Library
- Adafruit MPU6050
- ArduinoJson
```

## Configuración del Código

Abre el archivo `esp32_biomonitor.ino` y actualiza estas líneas (líneas 13-16):

```cpp
const char* ssid = "TU_SSID";           // Tu WiFi SSID
const char* password = "TU_PASSWORD";   // Tu WiFi Password
const char* serverURL = "http://192.168.1.100:5000"; // IP de tu backend
const char* authToken = "TU_TOKEN_JWT"; // Token JWT
```

### ¿Cómo obtener el Token JWT?

1. Inicia sesión en la aplicación web
2. Abre las DevTools (F12) → Application → Cookies
3. Busca el cookie `token` o revisa `localStorage`
4. Copia el token y pégalo en la variable `authToken`

Alternativa: Usa la API de login:

```bash
curl -X POST http://tu-backend:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tu_password"}'
```

Copialá el campo `token` de la respuesta.

## Conexiones Hardware

### Pines ESP32

| Componente | Pin |
|-----------|-----|
| MAX30102 SDA | GPIO 21 |
| MAX30102 SCL | GPIO 22 |
| MPU6050 SDA | GPIO 21 |
| MPU6050 SCL | GPIO 22 |
| OLED SDA | GPIO 21 |
| OLED SCL | GPIO 22 |

## Compilación y Carga

1. Selecciona: Tools → Board → ESP32 Dev Module
2. Selecciona el puerto COM correcto
3. Carga el código: Sketch → Upload (o Ctrl+U)

## Verificación

El ESP32 debe:

1. Conectarse a WiFi (verifica el Serial Monitor a 115200 baud)
2. Crear un nuevo Test en el backend
3. Enviar lecturas cada 5 segundos
4. Mostrar "WiFi: OK" en la pantalla OLED

## Monitoreo Serial

```
115200 baud
```

Deberías ver JSON con los datos en tiempo real:

```json
{
  "device_id":"esp32_01",
  "bpm":72,
  "spo2":98,
  "pasos":1234,
  "ax":0.123,
  "gx":0.456,
  "timestamp":12345678
}
```

## Solución de Problemas

### WiFi no se conecta
- Verifica SSID y password
- Asegúrate de que el ESP32 está cerca del router
- Revisa los logs en Serial Monitor

### Datos no se guardan en BD
- Verifica que el token JWT sea válido
- Comprueba que el backend está corriendo en el puerto correcto
- Revisa los errores HTTP en el Serial Monitor

### Sensores no funcionan
- Verifica las conexiones I2C (SDA/SCL)
- Comprueba las direcciones I2C:
  ```cpp
  // En setup() después del Wire.begin()
  Wire.begin();
  for (int i = 0; i < 127; i++) {
    Wire.beginTransmission(i);
    if (Wire.endTransmission() == 0) {
      Serial.print("Dispositivo I2C en: 0x");
      Serial.println(i, HEX);
    }
  }
  ```

## API Endpoints Utilizados

### POST /api/tests
Crear nuevo test
```json
{
  "paciente": {
    "nombreCompleto": "Nombre",
    "edad": 30,
    "altura": 170,
    "sexo": "M"
  },
  "medicoResponsable": "Dr. Juan García",
  "enfermedadPulmonar": "Ninguna",
  "fechaCaminata": "2026-03-04",
  "oxigenoSupplementario": false
}
```

### POST /api/tests/:id/readings
Agregar lectura
```json
{
  "frecuenciaCardiaca": 72,
  "spo2": 98,
  "pasos": 1234,
  "distancia": 500
}
```

### PUT /api/tests/:id
Actualizar test
```json
{
  "duracion": 10,
  "fcPromedio": 72,
  "spo2Promedio": 98,
  "estado": "en_progreso"
}
```

## Notas

- El test se crea automáticamente al conectarse al backend
- Las lecturas se envían cada 5 segundos
- El test se actualiza continuamente con promedios
- Presiona el botón RESET para crear un nuevo test

