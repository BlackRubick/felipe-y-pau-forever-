#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ───────── CREDENCIALES WiFi ─────────
const char* ssid = "TU_SSID";           // Reemplaza con tu WiFi SSID
const char* password = "TU_PASSWORD";   // Reemplaza con tu WiFi PASSWORD
const char* serverURL = "http://192.168.1.100:5000"; // IP de tu backend
const char* authToken = "TU_TOKEN_JWT"; // Token JWT del usuario médico

// ───────── PANTALLA ─────────
#define ANCHO_PANTALLA 128
#define ALTO_PANTALLA 64
#define OLED_RESET -1
#define DIRECCION_PANTALLA 0x3C

Adafruit_SSD1306 display(ANCHO_PANTALLA, ALTO_PANTALLA, &Wire, OLED_RESET);

// ───────── MAX30102 ─────────
MAX30105 SensorMax30102;

float Latidos_Promedio = 0;
float spo2 = 0;

const byte Tamaño_Tasa = 4;
byte rates[Tamaño_Tasa];
byte Tasa_Spot = 0;
long Latido_Anterior = 0;
float bpm_raw = 0;

#define Ventana_Muestra 100
uint32_t redBuffer[Ventana_Muestra];
uint32_t irBuffer[Ventana_Muestra];
int Bandera_Muestra = 0;
bool hayDedo = false;

// ───────── MPU6050 ─────────
Adafruit_MPU6050 mpu;

const float MAX_ACCEL = 78.4;
const float MAX_GYRO = 8.727;
float accel_x = 0.0;
float gyro_x = 0.0;

// ───────── CONTADOR DE PASOS ─────────
#define PASO_UMBRAL 0.02f
#define PASO_DEBOUNCE_MS 300
#define FILTRO_VENTANA 6

float filtroBuffer[FILTRO_VENTANA] = {0};
uint8_t filtroIndice = 0;
float señalFiltrada = 0.0f;
int8_t estadoCruce = 0;
unsigned long ultimoPaso = 0;
unsigned long contadorPasos = 0;

// ───────── CONTROL JSON ─────────
unsigned long lastJsonSend = 0;
#define JSON_INTERVAL 1000
#define ENVIO_SERVIDOR_INTERVAL 5000 // Enviar cada 5 segundos
unsigned long lastServerSend = 0;
const char* DEVICE_ID = "esp32_01";

// ───────── TEST ACTUAL ─────────
String testIdActual = "";
unsigned long tiempoInicioTest = 0;

// ───────────────────────────────────────────

float calcularSpO2(uint32_t *red, uint32_t *ir, int length);
float filtrarAceleracion(float muestra);
float calcularMagnitudDinamica(float ax, float ay, float az);
void detectarPaso(float señal);
void pantallaMonitor();
void enviarJSON();
void conectarWiFi();
void crearNuevoTest();
void enviarLecturaServidor();
void actualizarTest();

// ───────────────────────────────────────────
void setup() {

  Serial.begin(115200);
  delay(500);

  Wire.begin();
  Wire.setClock(400000);

  if (!display.begin(SSD1306_SWITCHCAPVCC, DIRECCION_PANTALLA)) {
    while (true);
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(10, 25);
  display.println("Sistema Iniciando...");
  display.display();
  delay(2000);

  if (!SensorMax30102.begin(Wire)) {
    while (true);
  }

  SensorMax30102.setup();
  SensorMax30102.setPulseAmplitudeRed(0x32);
  SensorMax30102.setPulseAmplitudeIR(0x32);
  SensorMax30102.setPulseAmplitudeGreen(0);

  if (!mpu.begin()) {
    while (true);
  }

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_5_HZ);

  // Conectar WiFi
  conectarWiFi();

  // Crear nuevo test
  crearNuevoTest();
}

// ───────────────────────────────────────────
void loop() {

  long Valor_IR = SensorMax30102.getIR();
  long Valor_Rojo = SensorMax30102.getRed();
  hayDedo = (Valor_Rojo > 40000);

  redBuffer[Bandera_Muestra] = Valor_Rojo;
  irBuffer[Bandera_Muestra] = Valor_IR;
  Bandera_Muestra++;

  if (checkForBeat(Valor_Rojo)) {
    long delta = millis() - Latido_Anterior;
    Latido_Anterior = millis();
    bpm_raw = 60.0 / (delta / 1000.0);

    if (bpm_raw > 20 && bpm_raw < 255) {
      rates[Tasa_Spot++] = (byte)bpm_raw;
      Tasa_Spot %= Tamaño_Tasa;
      Latidos_Promedio = 0;
      for (byte x = 0; x < Tamaño_Tasa; x++)
        Latidos_Promedio += rates[x];
      Latidos_Promedio /= Tamaño_Tasa;
    }
  }

  if (Bandera_Muestra == Ventana_Muestra) {
    spo2 = calcularSpO2(redBuffer, irBuffer, Ventana_Muestra);
    Bandera_Muestra = 0;
  }

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  accel_x = constrain(a.acceleration.x / MAX_ACCEL, -1.0f, 1.0f);
  gyro_x = constrain(g.gyro.x / MAX_GYRO, -1.0f, 1.0f);

  float mag = calcularMagnitudDinamica(a.acceleration.x, a.acceleration.y, a.acceleration.z);
  señalFiltrada = filtrarAceleracion(mag);
  detectarPaso(señalFiltrada);

  pantallaMonitor();

  // Enviar JSON por Serial
  if (millis() - lastJsonSend >= JSON_INTERVAL) {
    lastJsonSend = millis();
    enviarJSON();
  }

  // Enviar lecturas al servidor
  if (WiFi.status() == WL_CONNECTED && millis() - lastServerSend >= ENVIO_SERVIDOR_INTERVAL) {
    lastServerSend = millis();
    enviarLecturaServidor();
    actualizarTest();
  }
}

// ───────────────────────────────────────────
void conectarWiFi() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Conectando WiFi...");
  display.display();

  WiFi.begin(ssid, password);
  int intentos = 0;

  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500);
    Serial.print(".");
    intentos++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi conectado!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nNo se pudo conectar a WiFi");
  }
}

// ───────────────────────────────────────────
void crearNuevoTest() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi no conectado. No se puede crear test.");
    return;
  }

  HTTPClient http;
  String url = String(serverURL) + "/api/tests";

  // Crear documento JSON
  DynamicJsonDocument doc(512);
  doc["paciente"]["nombreCompleto"] = "Paciente Test";
  doc["paciente"]["edad"] = 30;
  doc["paciente"]["altura"] = 170;
  doc["paciente"]["sexo"] = "M";
  doc["medicoResponsable"] = "Dr. Juan García";
  doc["enfermedadPulmonar"] = "Ninguna";
  doc["fechaCaminata"] = "2026-03-04";
  doc["oxigenoSupplementario"] = false;

  String json;
  serializeJson(doc, json);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + authToken);

  int httpResponseCode = http.POST(json);

  if (httpResponseCode == 201) {
    String response = http.getString();
    DynamicJsonDocument docResponse(512);
    deserializeJson(docResponse, response);
    testIdActual = docResponse["id"].as<String>();
    tiempoInicioTest = millis();
    Serial.println("Test creado: " + testIdActual);
  } else {
    Serial.print("Error al crear test: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

// ───────────────────────────────────────────
void enviarLecturaServidor() {
  if (testIdActual == "" || WiFi.status() != WL_CONNECTED) {
    return;
  }

  HTTPClient http;
  String url = String(serverURL) + "/api/tests/" + testIdActual + "/readings";

  DynamicJsonDocument doc(256);
  doc["frecuenciaCardiaca"] = (int)Latidos_Promedio;
  doc["spo2"] = (int)spo2;
  doc["pasos"] = contadorPasos;
  doc["distancia"] = 0; // Calcular según pasos si es necesario

  String json;
  serializeJson(doc, json);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + authToken);

  int httpResponseCode = http.POST(json);

  if (httpResponseCode == 201) {
    Serial.println("Lectura enviada correctamente");
  } else {
    Serial.print("Error al enviar lectura: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

// ───────────────────────────────────────────
void actualizarTest() {
  if (testIdActual == "" || WiFi.status() != WL_CONNECTED) {
    return;
  }

  HTTPClient http;
  String url = String(serverURL) + "/api/tests/" + testIdActual;

  unsigned long duracionMs = millis() - tiempoInicioTest;
  unsigned long duracionMinutos = duracionMs / 60000;

  DynamicJsonDocument doc(256);
  doc["duracion"] = duracionMinutos;
  doc["fcPromedio"] = (int)Latidos_Promedio;
  doc["spo2Promedio"] = (int)spo2;
  doc["estado"] = "en_progreso";

  String json;
  serializeJson(doc, json);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + authToken);

  int httpResponseCode = http.PUT(json);

  if (httpResponseCode == 200) {
    Serial.println("Test actualizado");
  } else {
    Serial.print("Error al actualizar test: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

// ───────────────────────────────────────────
void enviarJSON() {
  Serial.print("{");
  Serial.print("\"device_id\":\""); Serial.print(DEVICE_ID); Serial.print("\",");
  Serial.print("\"bpm\":"); Serial.print(hayDedo ? (int)Latidos_Promedio : 0); Serial.print(",");
  Serial.print("\"spo2\":"); Serial.print(hayDedo ? (int)spo2 : 0); Serial.print(",");
  Serial.print("\"pasos\":"); Serial.print(contadorPasos); Serial.print(",");
  Serial.print("\"ax\":"); Serial.print(accel_x, 3); Serial.print(",");
  Serial.print("\"gx\":"); Serial.print(gyro_x, 3); Serial.print(",");
  Serial.print("\"timestamp\":"); Serial.print(millis());
  Serial.println("}");
}

// ───────────────────────────────────────────
float filtrarAceleracion(float muestra) {
  filtroBuffer[filtroIndice] = muestra;
  filtroIndice = (filtroIndice + 1) % FILTRO_VENTANA;
  float suma = 0;
  for (uint8_t i = 0; i < FILTRO_VENTANA; i++)
    suma += filtroBuffer[i];
  return suma / FILTRO_VENTANA;
}

float calcularMagnitudDinamica(float ax, float ay, float az) {
  float mag = sqrt(ax * ax + ay * ay + az * az);
  return constrain((mag - 9.81f) / MAX_ACCEL, -1.0f, 1.0f);
}

void detectarPaso(float señal) {
  if (señal > PASO_UMBRAL) {
    estadoCruce = 1;
  } else if (señal < -PASO_UMBRAL) {
    if (estadoCruce == 1) {
      unsigned long ahora = millis();
      if (ahora - ultimoPaso >= PASO_DEBOUNCE_MS) {
        contadorPasos++;
        ultimoPaso = ahora;
      }
    }
    estadoCruce = -1;
  }
}

float calcularSpO2(uint32_t *red, uint32_t *ir, int length) {
  double sumRedAC = 0, sumIrAC = 0, sumRedDC = 0, sumIrDC = 0;

  for (int i = 1; i < length; i++) {
    sumRedAC += abs((int)red[i] - (int)red[i - 1]);
    sumIrAC += abs((int)ir[i] - (int)ir[i - 1]);
    sumRedDC += red[i];
    sumIrDC += ir[i];
  }

  double avgRedDC = sumRedDC / (length - 1);
  double avgIrDC = sumIrDC / (length - 1);
  double R = (sumRedAC / avgRedDC) / (sumIrAC / avgIrDC);
  float SpO2 = 110.0f - 25.0f * R;

  if (SpO2 > 100) SpO2 = 100;
  if (SpO2 < 0) SpO2 = 0;
  return SpO2;
}

void pantallaMonitor() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Monitor Biom.");
  display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

  display.setCursor(0, 14);
  display.print("BPM: "); display.print((int)Latidos_Promedio);
  display.print(" O2: "); display.print((int)spo2); display.print("%");

  display.setTextSize(2);
  display.setCursor(0, 26);
  display.print("Pasos:");
  display.println(contadorPasos);

  // Estado WiFi
  display.setTextSize(1);
  display.setCursor(0, 50);
  if (WiFi.status() == WL_CONNECTED) {
    display.println("WiFi: OK");
  } else {
    display.println("WiFi: NO");
  }

  display.display();
}
