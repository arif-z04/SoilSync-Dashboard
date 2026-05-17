/*
 * FIELD KIT — LoRa Transmitter
 * Hardware: Arduino Nano + LoRa SX1278 + YL69 + TP4056 + MT3608 + Solar
 *
 * Pin map:
 *   LoRa NSS  → D10  | MOSI → D11 | MISO → D12 | SCK → D13
 *   LoRa RST  → D9   | DIO0 → D2
 *   YL69 AO   → A0   | DO   → not used
 *   Solar div → D3 (analog read via analogRead — A3 label depends on board)
 *   Battery   → A1   (10K/10K divider → 0–2.5V → maps to 0–5V battery)
 *
 * Solar divider: 10K + 20K from panel to GND, tap at D3 pin (use analogRead(A3) if wired there).
 * Battery divider: 10K + 10K → tap at A1 pin (maps 0–5V to 0–2.5V at pin).
 */

#include <SPI.h>
#include <LoRa.h>

// ── Pin definitions ────
#define LORA_NSS    10
#define LORA_RST     9
#define LORA_DIO0    2

#define SOIL_PIN    A0   // YL-69 analog output
#define BATT_PIN    A1   // Battery voltage divider tap
#define SOLAR_PIN   A3  // Solar voltage divider tap (wired to D3 pad = A3 on Nano)

// ── Calibration ──────────────────────────────────────────────────
// YL-69: higher ADC = dryer (inverted). Calibrate these for your sensor.
#define SOIL_DRY    850  // ADC value when completely dry
#define SOIL_WET    300  // ADC value when saturated

// Voltage divider scaling
// Battery: 10K/10K → Vpin = Vbatt/2 → Vbatt = Vpin × 2
// Solar: 10K/20K   → Vpin = Vsolar × 20/(10+20) = Vsolar × 0.667 → Vsolar = Vpin × 1.5
#define BATT_SCALE   2.0f
#define SOLAR_SCALE  1.5f
#define ADC_REF      5.0f   // Arduino Nano uses 5V reference
#define ADC_MAX      1023.0f

// Li-Ion battery thresholds (voltage after divider compensation)
#define BATT_FULL    4.2f
#define BATT_EMPTY   3.0f

// Transmission interval
#define TX_INTERVAL  10000  // ms

// ── LoRa settings ────────────────────────────────────────────────
#define LORA_FREQ    433E6  // 433 MHz — change to 915E6 or 868E6 if needed
#define LORA_SF      9      // Spreading Factor (7–12; higher = longer range, slower)
#define LORA_BW      125E3  // Bandwidth
#define LORA_CR      5      // Coding rate 4/5

unsigned long lastTx = 0;

// ── Helpers ──────────────────────────────────────────────────────
float readBatteryVoltage() {
  int raw = analogRead(BATT_PIN);
  float vPin = (raw / ADC_MAX) * ADC_REF;
  return ;
}

float readSolarVoltage() {
  int raw = analogRead(SOLAR_PIN);
  float vPin = (raw / ADC_MAX) * ADC_REF;
  return vPin * SOLAR_SCALE;
}

int readSoilRaw() {
  return analogRead(SOIL_PIN);
}

int readSoilPercent() {
  int raw = analogRead(SOIL_PIN);
  int pct = map(raw, SOIL_DRY, SOIL_WET, 0, 100);
  return constrain(pct, 0, 100);
}

int batteryPercent(float v) {
  float pct = (v - BATT_EMPTY) / (BATT_FULL - BATT_EMPTY) * 100.0f;
  return (int)constrain(pct, 0, 100);
}

// Returns "DRY", "MID", or "WET"
const char* soilStatus(int pct) {
  if (pct < 30) return "DRY";
  if (pct < 60) return "MID";
  return "WET";
}

// Returns "ON" or "OFF" based on solar voltage
const char* solarStatus(float v) {
  return (v > 0.5f) ? "ON" : "OFF";
}

void setup() {
  Serial.begin(9600);
  Serial.println(F("[FIELD] Booting..."));

  LoRa.setPins(LORA_NSS, LORA_RST, LORA_DIO0);

  int retries = 5;
  while (!LoRa.begin(LORA_FREQ) && retries-- > 0) {
    Serial.println(F("[FIELD] LoRa init failed, retrying..."));
    delay(1000);
  }

  if (retries < 0) {
    Serial.println(F("[FIELD] LoRa FAILED. Check wiring. Halting."));
    while (true); // halt
  }

  LoRa.setSpreadingFactor(LORA_SF);
  LoRa.setSignalBandwidth(LORA_BW);
  LoRa.setCodingRate4(LORA_CR);
  LoRa.enableCrc(); // detect corrupted packets

  Serial.println(F("[FIELD] LoRa ready."));
}

void loop() {
  unsigned long now = millis();

  if (now - lastTx >= TX_INTERVAL) {
    lastTx = now;

    // ── Read sensors ─────────────────────────────────────────────
    float battV   = readBatteryVoltage();
    float solarV  = readSolarVoltage();
    
    int   soilRaw = readSoilRaw();
    int   soilPct = map(soilRaw, SOIL_DRY, SOIL_WET, 0, 100);
    
    soilPct = constrain(soilPct, 0, 100);


    int   battPct = batteryPercent(battV);
    const char* status = soilStatus(soilPct);
    const char* solar  = solarStatus(solarV);

    // ── Validate readings ─────────────────────────────────────────
    bool valid = true;
    if (battV < 0.5f || battV > 5.5f) { Serial.println(F("[FIELD] WARN: battery reading out of range")); valid = false; }
    if (soilPct < 0  || soilPct > 100) { Serial.println(F("[FIELD] WARN: soil reading out of range"));   valid = false; }

    if (!valid) {
      Serial.println(F("[FIELD] Skipping TX due to invalid sensor data."));
      return;
    }

  // ── Build packet (NEW FORMAT) ─────────────────────────────
  String packet =
    String(millis()) + "|" +        // TIMESTAMP
    String(soilPct) + "|" +         // SoilPct
    String(soilRaw) + "|" +         // RAW ADC VALUE
    String(status) + "|" +          // STATUS
    String(battPct) + "|" +         // BAT %
    String(solar) + "|" +           // SOLAR ON/OFF
    String(solarV, 2) + "|" +       // SOLAR VOLT
    String(battV, 2);               // BAT VOLT  
  // ── Transmit ──────────────────────────────────────────────────
    LoRa.beginPacket();
    LoRa.print(packet);
    int result = LoRa.endPacket();

    if (result) {
      Serial.print(F("[FIELD] TX OK → ")); Serial.println(packet);
    } else {
      Serial.println(F("[FIELD] TX FAILED"));
    }
  }
} 

