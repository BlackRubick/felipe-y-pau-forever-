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

const char* ssid      = "Totalplay-F3A4";
const char* password  = "F3A4F5CED2EaHjhh";
const char* serverURL = "http://192.168.100.252:3001";
const char* authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwY2VmNDY3LTAwNzgtNGRkZS04YWE5LTMyN2M1MDkzMTgxYiIsImVtYWlsIjoiYW1heWFAaG90bWFpbC5jb20iLCJyb2xlIjoibWVkaWNvIiwiaWF0IjoxNzczMjUwMTU2LCJleHAiOjE3NzMzMzY1NTZ9.k9Jiyxdl2E9T-Nnp4GiloIM8QuvFSL2e9r_nEx1VGcg";


const bool USAR_TEST_ID_FIJO = true;
const char* TEST_ID_FIJO = "test-72f4ca6a&tab"; 

// ================== PANTALLA ==================
#define ANCHO_PANTALLA      128
#define ALTO_PANTALLA       64
#define OLED_RESET          -1
#define DIRECCION_PANTALLA  0x3C

Adafruit_SSD1306 display(ANCHO_PANTALLA, ALTO_PANTALLA, &Wire, OLED_RESET);

// ================== MAX30102 ==================
MAX30105 SensorMax30102;

float Latidos_Promedio = 0;
float spo2 = 0;

const byte Tamano_Tasa = 4;
byte rates[Tamano_Tasa] = {0};
byte Tasa_Spot = 0;
long Latido_Anterior = 0;
float bpm_raw = 0;

#define Ventana_Muestra 100
uint32_t redBuffer[Ventana_Muestra];
uint32_t irBuffer[Ventana_Muestra];
int Bandera_Muestra = 0;
bool hayDedo = false;

// ================== MPU6050 ==================
Adafruit_MPU6050 mpu;

const float MAX_ACCEL = 78.4f;
const float MAX_GYRO  = 8.727f;
float accel_x = 0.0f;
float gyro_x  = 0.0f;

// ================== PASOS ==================
#define PASO_UMBRAL       0.02f
#define PASO_DEBOUNCE_MS  300
#define FILTRO_VENTANA    6

float filtroBuffer[FILTRO_VENTANA] = {0};
uint8_t filtroIndice = 0;
float senalFiltrada = 0.0f;
int8_t estadoCruce = 0;
unsigned long ultimoPaso = 0;
unsigned long contadorPasos = 0;

// ================== TIMERS ==================
unsigned long lastDisplayUpdate = 0;
unsigned long lastJsonSend = 0;
unsigned long lastServerSend = 0;
unsigned long lastWifiRetry = 0;

#define DISPLAY_INTERVAL          500
#define JSON_INTERVAL             1000
#define ENVIO_SERVIDOR_INTERVAL   5000
#define WIFI_RETRY_INTERVAL       10000

const char* DEVICE_ID = "esp32_01";

// ================== TEST ==================
String testIdActual = "";
unsigned long tiempoInicioTest = 0;

// ================== PROTOTIPOS ==================
float calcularSpO2(uint32_t *red, uint32_t *ir, int length);
float filtrarAceleracion(float muestra);
float calcularMagnitudDinamica(float ax, float ay, float az);
void  detectarPaso(float senal);
void  pantallaMonitor();
void  enviarJSON();

void  conectarWiFi();
void  asegurarWiFi();

void  crearNuevoTest();
void  enviarLecturaServidor();
void  actualizarTest();
String normalizarTestId(const String& input);

bool  prepararHttp(HTTPClient& http, const String& url);
void  logHttpError(HTTPClient& http, int code, const char* contexto);

String normalizarTestId(const String& input) {
  String id = input;

  int idxTestId = id.indexOf("testId=");
  if (idxTestId >= 0) {
    id = id.substring(idxTestId + 7);
  }

  int idxAmp = id.indexOf('&');
  if (idxAmp >= 0) {
    id = id.substring(0, idxAmp);
  }

  int idxQ = id.indexOf('?');
  if (idxQ >= 0) {
    id = id.substring(0, idxQ);
  }

  id.trim();
  return id;
}

// =======================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Wire.begin();
  Wire.setClock(400000);

  if (!display.begin(SSD1306_SWITCHCAPVCC, DIRECCION_PANTALLA)) {
    Serial.println(F("Error: SSD1306 no detectado"));
    while (true) {}
  }

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(10, 25);
  display.println("Sistema Iniciando...");
  display.display();
  delay(1200);

  if (!SensorMax30102.begin(Wire)) {
    Serial.println("Error: MAX30102 no detectado.");
    while (true) {}
  }
  SensorMax30102.setup();
  SensorMax30102.setPulseAmplitudeRed(0x32);
  SensorMax30102.setPulseAmplitudeIR(0x32);
  SensorMax30102.setPulseAmplitudeGreen(0);

  if (!mpu.begin()) {
    Serial.println("Error: MPU6050 no detectado.");
    while (true) {}
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_5_HZ);

  conectarWiFi();

  if (USAR_TEST_ID_FIJO && strlen(TEST_ID_FIJO) > 0) {
    testIdActual = normalizarTestId(String(TEST_ID_FIJO));
    tiempoInicioTest = millis();
    Serial.println("Usando TEST_ID_FIJO: " + testIdActual);
  } else {
    crearNuevoTest();
  }

  Serial.println("=== Sistema iniciado ===");
}

// =======================================================
void loop() {
  asegurarWiFi();

  long Valor_IR   = SensorMax30102.getIR();
  long Valor_Rojo = SensorMax30102.getRed();
  hayDedo = (Valor_Rojo > 40000);

  redBuffer[Bandera_Muestra] = Valor_Rojo;
  irBuffer[Bandera_Muestra]  = Valor_IR;
  Bandera_Muestra++;

  if (checkForBeat(Valor_Rojo)) {
    long delta = millis() - Latido_Anterior;
    Latido_Anterior = millis();

    if (delta > 0) {
      bpm_raw = 60.0f / (delta / 1000.0f);

      if (bpm_raw > 20 && bpm_raw < 255) {
        rates[Tasa_Spot++] = (byte)bpm_raw;
        Tasa_Spot %= Tamano_Tasa;

        Latidos_Promedio = 0;
        for (byte x = 0; x < Tamano_Tasa; x++) {
          Latidos_Promedio += rates[x];
        }
        Latidos_Promedio /= Tamano_Tasa;
      }
    }
  }

  if (Bandera_Muestra >= Ventana_Muestra) {
    spo2 = calcularSpO2(redBuffer, irBuffer, Ventana_Muestra);
    Bandera_Muestra = 0;
  }

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  accel_x = constrain(a.acceleration.x / MAX_ACCEL, -1.0f, 1.0f);
  gyro_x  = constrain(g.gyro.x / MAX_GYRO,  -1.0f, 1.0f);

  float mag = calcularMagnitudDinamica(a.acceleration.x, a.acceleration.y, a.acceleration.z);
  senalFiltrada = filtrarAceleracion(mag);
  detectarPaso(senalFiltrada);

  if (millis() - lastDisplayUpdate >= DISPLAY_INTERVAL) {
    lastDisplayUpdate = millis();
    pantallaMonitor();
  }

  if (millis() - lastJsonSend >= JSON_INTERVAL) {
    lastJsonSend = millis();
    enviarJSON();
  }

  if (WiFi.status() == WL_CONNECTED && millis() - lastServerSend >= ENVIO_SERVIDOR_INTERVAL) {
    lastServerSend = millis();

    if (testIdActual.length() == 0) {
      Serial.println("Sin testIdActual. Intentando crear test...");
      crearNuevoTest();
    } else {
      enviarLecturaServidor();
      actualizarTest();
    }
  }
}

// =======================================================
void conectarWiFi() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Conectando WiFi...");
  display.display();

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 30) {
    delay(500);
    Serial.print(".");
    intentos++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi conectado!");
    Serial.print("IP ESP32: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nNo se pudo conectar a WiFi");
  }
}

void asegurarWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  if (millis() - lastWifiRetry < WIFI_RETRY_INTERVAL) return;
  lastWifiRetry = millis();

  Serial.println("WiFi caido. Reintentando conexion...");
  WiFi.disconnect();
  WiFi.begin(ssid, password);
}

// =======================================================
bool prepararHttp(HTTPClient& http, const String& url) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("HTTP abortado: sin WiFi");
    return false;
  }
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + authToken);
  return true;
}

void logHttpError(HTTPClient& http, int code, const char* contexto) {
  Serial.print("Error ");
  Serial.print(contexto);
  Serial.print(" HTTP: ");
  Serial.println(code);

  if (code > 0) {
    String body = http.getString();
    Serial.print("Body error: ");
    Serial.println(body);
  } else {
    Serial.print("Detalle: ");
    Serial.println(http.errorToString(code));
  }
}

// =======================================================
void crearNuevoTest() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi no conectado. No se puede crear test.");
    return;
  }

  HTTPClient http;
  String url = String(serverURL) + "/api/tests";
  if (!prepararHttp(http, url)) return;

  DynamicJsonDocument doc(768);
  doc["paciente"]["id"]            = "patient-esp32";
  doc["paciente"]["nombreCompleto"] = "Paciente ESP32";
  doc["paciente"]["edad"]           = 30;
  doc["paciente"]["altura"]         = 170;
  doc["paciente"]["peso"]           = 70;
  doc["paciente"]["sexo"]           = "M";
  doc["paciente"]["raza"]           = "Latina";
  doc["medicoResponsable"]          = "ESP32";
  doc["enfermedadPulmonar"]         = "EPOC";
  doc["numeroCaminata"]             = 1;
  doc["fechaCaminata"]              = "2026-03-11";
  doc["presionSanguineaInicial"]    = "120/80";
  doc["oxigenoSupplementario"]      = false;
  doc["observacionesPrevias"]       = "Creado desde ESP32";

  String json;
  serializeJson(doc, json);

  int httpResponseCode = http.POST(json);

  if (httpResponseCode == 201) {
    String response = http.getString();
    DynamicJsonDocument docResponse(1024);
    DeserializationError err = deserializeJson(docResponse, response);

    if (err) {
      Serial.print("Error parseando respuesta create test: ");
      Serial.println(err.c_str());
      testIdActual = "";
    } else {
      testIdActual = docResponse["id"].as<String>();
      tiempoInicioTest = millis();
      Serial.println("Test creado: " + testIdActual);
    }
  } else {
    logHttpError(http, httpResponseCode, "crear test");
  }

  http.end();
}

// =======================================================
void enviarLecturaServidor() {
  if (testIdActual.length() == 0 || WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(serverURL) + "/api/tests/" + testIdActual + "/readings";
  if (!prepararHttp(http, url)) return;

  unsigned long elapsedSec = (millis() - tiempoInicioTest) / 1000;

  DynamicJsonDocument doc(256);
  doc["frecuenciaCardiaca"] = hayDedo ? (int)Latidos_Promedio : 0;
  doc["spo2"]               = hayDedo ? (int)spo2 : 0;
  doc["pasos"]              = contadorPasos;
  doc["distancia"]          = 0;
  doc["tiempo"]             = elapsedSec;

  String json;
  serializeJson(doc, json);

  int httpResponseCode = http.POST(json);

  if (httpResponseCode == 201) {
    Serial.println("Lectura enviada correctamente");
  } else {
    logHttpError(http, httpResponseCode, "enviar lectura");
  }

  http.end();
}

// =======================================================
void actualizarTest() {
  if (testIdActual.length() == 0 || WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(serverURL) + "/api/tests/" + testIdActual;
  if (!prepararHttp(http, url)) return;

  unsigned long duracionSec = (millis() - tiempoInicioTest) / 1000;

  DynamicJsonDocument doc(256);
  doc["duracion"]     = duracionSec;
  doc["fcPromedio"]   = hayDedo ? (int)Latidos_Promedio : 0;
  doc["spo2Promedio"] = hayDedo ? (int)spo2 : 0;
  doc["estado"]       = "en_progreso";

  String json;
  serializeJson(doc, json);

  int httpResponseCode = http.PUT(json);

  if (httpResponseCode == 200) {
    Serial.println("Test actualizado");
  } else {
    logHttpError(http, httpResponseCode, "actualizar test");
  }

  http.end();
}

// =======================================================
void enviarJSON() {
  Serial.print("{");
  Serial.print("\"device_id\":\""); Serial.print(DEVICE_ID); Serial.print("\",");
  Serial.print("\"test_id\":\"");   Serial.print(testIdActual); Serial.print("\",");
  Serial.print("\"bpm\":");         Serial.print(hayDedo ? (int)Latidos_Promedio : 0); Serial.print(",");
  Serial.print("\"spo2\":");        Serial.print(hayDedo ? (int)spo2 : 0); Serial.print(",");
  Serial.print("\"pasos\":");       Serial.print(contadorPasos); Serial.print(",");
  Serial.print("\"ax\":");          Serial.print(accel_x, 3); Serial.print(",");
  Serial.print("\"gx\":");          Serial.print(gyro_x, 3); Serial.print(",");
  Serial.print("\"wifi\":");        Serial.print(WiFi.status() == WL_CONNECTED ? 1 : 0); Serial.print(",");
  Serial.print("\"timestamp\":");   Serial.print(millis());
  Serial.println("}");
}

// =======================================================
float filtrarAceleracion(float muestra) {
  filtroBuffer[filtroIndice] = muestra;
  filtroIndice = (filtroIndice + 1) % FILTRO_VENTANA;

  float suma = 0;
  for (uint8_t i = 0; i < FILTRO_VENTANA; i++) {
    suma += filtroBuffer[i];
  }
  return suma / FILTRO_VENTANA;
}

float calcularMagnitudDinamica(float ax, float ay, float az) {
  float mag = sqrt(ax * ax + ay * ay + az * az);
  return constrain((mag - 9.81f) / MAX_ACCEL, -1.0f, 1.0f);
}

void detectarPaso(float senal) {
  if (senal > PASO_UMBRAL) {
    estadoCruce = 1;
  } else if (senal < -PASO_UMBRAL) {
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
    sumIrAC  += abs((int)ir[i] - (int)ir[i - 1]);
    sumRedDC += red[i];
    sumIrDC  += ir[i];
  }

  double avgRedDC = sumRedDC / (length - 1);
  double avgIrDC  = sumIrDC  / (length - 1);

  if (avgRedDC <= 0 || avgIrDC <= 0 || sumIrAC <= 0) return 0;

  double R = (sumRedAC / avgRedDC) / (sumIrAC / avgIrDC);
  float SpO2 = 110.0f - 25.0f * R;

  if (SpO2 > 100) SpO2 = 100;
  if (SpO2 < 0)   SpO2 = 0;
  return SpO2;
}

// =======================================================
void pantallaMonitor() {
  display.clearDisplay();

  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Monitor Biom.");
  display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

  display.setCursor(0, 14);
  if (!hayDedo) {
    display.print("BPM: --  O2: --%");
  } else {
    display.print("BPM:"); display.print((int)Latidos_Promedio);
    display.print(" O2:"); display.print((int)spo2); display.print("%");
  }

  display.setTextSize(2);
  display.setCursor(0, 26);
  display.print("Pasos:");
  display.println(contadorPasos);

  display.setTextSize(1);
  display.setCursor(0, 50);
  if (WiFi.status() == WL_CONNECTED) {
    display.print("WiFi: OK ");
  } else {
    display.print("WiFi: NO ");
  }
  display.print("T:");
  display.print(testIdActual.length() > 0 ? "OK" : "NO");

  display.display();
}