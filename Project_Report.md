### Transmitter Code:

```Cpp
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


```

### Transmitter — Line-by-line Explanation

1. `#include <SPI.h>` — Include SPI library used by LoRa module for SPI bus communication.
2. `#include <LoRa.h>` — Include the LoRa radio library (provides LoRa functions).

// Pin definitions
3. `#define LORA_NSS 10` — Chip-select (NSS) pin for SX1278.
4. `#define LORA_RST 9` — Reset pin for SX1278.
5. `#define LORA_DIO0 2` — DIO0 interrupt pin used by LoRa library to signal RX/TX events.

6. `#define SOIL_PIN A0` — Analog input connected to YL-69 soil sensor.
7. `#define BATT_PIN A1` — Analog input for the battery divider tap.
8. `#define SOLAR_PIN A3` — Analog input for the solar divider tap (D3 pad wired to A3 on Nano).

// Calibration and scaling
9. `#define SOIL_DRY 850` / `#define SOIL_WET 300` — Calibration ADC values mapping raw sensor range to percent.
10. `#define BATT_SCALE 2.0f` — Multiplier to compensate battery divider (Vbatt = vPin * 2).
11. `#define SOLAR_SCALE 1.5f` — Multiplier for solar divider (Vsolar = vPin * 1.5).
12. `#define ADC_REF 5.0f` / `#define ADC_MAX 1023.0f` — ADC reference voltage and max ADC value for conversions.

// Battery thresholds and TX interval
13. `#define BATT_FULL 4.2f` / `#define BATT_EMPTY 3.0f` — Voltage bounds used to compute battery percent.
14. `#define TX_INTERVAL 10000` — Milliseconds between transmissions.

// LoRa settings
15. `#define LORA_FREQ 433E6` — Radio frequency; must match receiver.
16. `#define LORA_SF 9` — Spreading factor; higher increases sensitivity and airtime.
17. `#define LORA_BW 125E3` — Bandwidth in Hz.
18. `#define LORA_CR 5` — Coding rate (4/5). Higher improves error correction at cost of throughput.

19. `unsigned long lastTx = 0;` — Tracks last transmit timestamp (ms).

// Helpers
20. `float readBatteryVoltage() { int raw = analogRead(BATT_PIN); float vPin = (raw / ADC_MAX) * ADC_REF; return ; }`
  — Reads raw ADC from `BATT_PIN`, converts to pin voltage `vPin`. (Bug: missing return value; should be `return vPin * BATT_SCALE;`).
21. `float readSolarVoltage() { int raw = analogRead(SOLAR_PIN); float vPin = (raw / ADC_MAX) * ADC_REF; return vPin * SOLAR_SCALE; }`
  — Reads solar ADC, converts to real solar voltage by scaling.
22. `int readSoilRaw() { return analogRead(SOIL_PIN); }` — Returns raw ADC from soil sensor.
23. `int readSoilPercent() { int raw = analogRead(SOIL_PIN); int pct = map(raw, SOIL_DRY, SOIL_WET, 0, 100); return constrain(pct, 0, 100); }`
  — Maps raw ADC to 0–100% using calibration endpoints and constrains result.
24. `int batteryPercent(float v) { float pct = (v - BATT_EMPTY) / (BATT_FULL - BATT_EMPTY) * 100.0f; return (int)constrain(pct, 0, 100); }`
  — Converts measured battery voltage to percentage based on thresholds.

25. `const char* soilStatus(int pct) { if (pct < 30) return "DRY"; if (pct < 60) return "MID"; return "WET"; }`
  — Categorizes soil percent into three textual statuses.
26. `const char* solarStatus(float v) { return (v > 0.5f) ? "ON" : "OFF"; }` — Simple on/off threshold for solar input.

// Setup
27. `void setup() { Serial.begin(9600); Serial.println(F("[FIELD] Booting...")); LoRa.setPins(LORA_NSS, LORA_RST, LORA_DIO0); ... }`
  — Starts Serial for debug, assigns LoRa pins, and initializes radio with retries.
28. `while (!LoRa.begin(LORA_FREQ) && retries-- > 0) { ... }` — Attempt to bring up LoRa; retries with 1s delay.
29. `LoRa.setSpreadingFactor(LORA_SF); LoRa.setSignalBandwidth(LORA_BW); LoRa.setCodingRate4(LORA_CR); LoRa.enableCrc();` — Applies radio parameters and enables CRC checking.

// Main loop
30. `void loop() { unsigned long now = millis(); if (now - lastTx >= TX_INTERVAL) { lastTx = now; ... } }` — Periodic send based on `TX_INTERVAL`.
31. `float battV = readBatteryVoltage(); float solarV = readSolarVoltage();` — Sample voltages (note: battery helper currently broken).
32. `int soilRaw = readSoilRaw(); int soilPct = map(soilRaw, SOIL_DRY, SOIL_WET, 0, 100); soilPct = constrain(soilPct, 0, 100);` — Compute soil percent from raw reading.
33. `int battPct = batteryPercent(battV); const char* status = soilStatus(soilPct); const char* solar = solarStatus(solarV);` — Compute derived indicators.
34. `bool valid = true; if (battV < 0.5f || battV > 5.5f) { ... }` — Basic sanity checks; skip TX if readings are clearly out-of-range.
35. `String packet = String(millis()) + "|" + String(soilPct) + "|" + String(soilRaw) + "|" + String(status) + "|" + String(battPct) + "|" + String(solar) + "|" + String(solarV, 2) + "|" + String(battV, 2);` — Build human-readable pipe-separated packet.
36. `LoRa.beginPacket(); LoRa.print(packet); int result = LoRa.endPacket();` — Transmit packet and capture library return code.
37. `if (result) Serial.print(F("[FIELD] TX OK → ")); else Serial.println(F("[FIELD] TX FAILED"));` — Log success/failure.

38. `}` — End of TX tick; loop repeats.

---



### Receiver Code:

```Cpp
#include <SPI.h>
#include <LoRa.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ── Pin definitions ──────────────────────────────────────────────
#define LORA_NSS   10
#define LORA_RST    9
#define LORA_DIO0   2   
#define LED_RED     4
#define LED_YELLOW  5
#define LED_GREEN   6
#define BUZZER_PIN  7

// ── LoRa settings (must match transmitter!) ──────────────────────
#define LORA_FREQ   433E6
#define LORA_SF     9
#define LORA_BW     125E3
#define LORA_CR     5

// ── LCD ──────────────────────────────────────────────────────────
// Change 0x27 to 0x3F if your I2C LCD uses that address
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ── State ────────────────────────────────────────────────────────
#define TIMEOUT_MS   30000UL  // 30s — show "NO SIGNAL" if no packet received

unsigned long lastPacketTime = 0;
bool          signalLost     = false;

// Parsed sensor data
char  soilStatus[8] = "---";
int   soilLevel     = 0;
int   soilRaw       = 0;
char  solarSt[4]    = "---";
int   battPct       = 0;
float battV         = 0.0f;
float solarV        = 0.0f;


// ── Helpers ──────────────────────────────────────────────────────
void setLEDs(bool red, bool yellow, bool green) {
  digitalWrite(LED_RED,    red    ? HIGH : LOW);
  digitalWrite(LED_YELLOW, yellow ? HIGH : LOW);
  digitalWrite(LED_GREEN,  green  ? HIGH : LOW);
}

void allLedsOff() { setLEDs(false, false, false); }

void buzzWarning() {
  // Short two-beep pattern for DRY alert
  tone(BUZZER_PIN, 1200, 200);
  delay(250);
  tone(BUZZER_PIN, 1200, 200);
  delay(250);
  noTone(BUZZER_PIN);
}

void updateIndicators() {
  allLedsOff();
  if (strcmp(soilStatus, "DRY") == 0) {
    setLEDs(true, false, false);   // Red
    buzzWarning();
  } else if (strcmp(soilStatus, "MID") == 0) {
    setLEDs(false, true, false);   // Yellow
  } else if (strcmp(soilStatus, "WET") == 0) {
    setLEDs(false, false, true);   // Green
  }
}

// Line 1: " STATUS: WET    " (padded to 16 chars)
// Line 2: " SL:72 S:ON B:78%" 
void updateLCD() {
  lcd.clear();

// ── Line 1 ────────────────────────────────────────────────────
lcd.setCursor(0, 0);

if (signalLost) {
  lcd.print("  !! NO SIGNAL");
  return;
}

const char* label = "???";

if (strcmp(soilStatus, "DRY") == 0)
  label = "DRY";

else if (strcmp(soilStatus, "MID") == 0)
  label = "MED";

else if (strcmp(soilStatus, "WET") == 0)
  label = "WET";

// STATUS + Battery
String line1 =
  "ST:" + String(label) +
  " B:" + String(battPct) + "%";

lcd.print(line1);

// ── Line 2 ────────────────────────────────────────────────────
lcd.setCursor(0, 1);

// Soil + Solar
String line2 =
  "R:" + String(soilRaw) +
  " SL:" + String(soilLevel) +
  " S:" + String(solarSt);

lcd.print(line2);
}

// ── Packet parser ────────────────────────────────────────────────
// Expected format:
// TIME|SOIL%|SOIL_RAW|STATUS|BAT|SOLAR|SOLAR_VOLT|BAT_VOLT

bool parsePacket(const String& data) {

  int p1 = data.indexOf('|');
  int p2 = data.indexOf('|', p1 + 1);
  int p3 = data.indexOf('|', p2 + 1);
  int p4 = data.indexOf('|', p3 + 1);
  int p5 = data.indexOf('|', p4 + 1);
  int p6 = data.indexOf('|', p5 + 1);
  int p7 = data.indexOf('|', p6 + 1);

  if (p1 < 0 || p2 < 0 || p3 < 0 ||
      p4 < 0 || p5 < 0 || p6 < 0 || p7 < 0) {

    Serial.println("[HOME] BAD PACKET FORMAT");
    return false;
  }

  // ── Parse Fields ───────────────────────────────────────────

  unsigned long timestamp =
    data.substring(0, p1).toInt();

  // Soil percentage
  soilLevel =
    data.substring(p1 + 1, p2).toInt();

  // Raw ADC value
  soilRaw =
    data.substring(p2 + 1, p3).toInt();

  // Soil status
  strncpy(
    soilStatus,
    data.substring(p3 + 1, p4).c_str(),
    sizeof(soilStatus)
  );

  // Battery %
  battPct =
    data.substring(p4 + 1, p5).toInt();

  // Solar ON/OFF
  strncpy(
    solarSt,
    data.substring(p5 + 1, p6).c_str(),
    sizeof(solarSt)
  );

  // Solar voltage
  solarV =
    data.substring(p6 + 1, p7).toFloat();

  // Battery voltage
  battV =
    data.substring(p7 + 1).toFloat();

  return true;
}


// ── Setup ────────────────────────────────────────────────────────
void setup() {
  Serial.begin(9600);
  Serial.println(F("[HOME] Booting..."));

  pinMode(LED_RED,    OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_GREEN,  OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  allLedsOff();

  // LCD init
  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("  Waiting for  ");
  lcd.setCursor(0, 1);
  lcd.print("  field data.. ");

  // LoRa init
  LoRa.setPins(LORA_NSS, LORA_RST, LORA_DIO0);

  int retries = 5;
  while (!LoRa.begin(LORA_FREQ) && retries-- > 0) {
    Serial.println(F("[HOME] LoRa init failed, retrying..."));
    delay(1000);
  }
  if (retries < 0) {
    Serial.println(F("[HOME] LoRa FAILED. Halting."));
    lcd.clear();
    lcd.print("LoRa FAIL!");
    while (true);
  }

  LoRa.setSpreadingFactor(LORA_SF);
  LoRa.setSignalBandwidth(LORA_BW);
  LoRa.setCodingRate4(LORA_CR);
  LoRa.enableCrc();

  Serial.println(F("[HOME] LoRa ready. Listening..."));
}

// ── Loop ─────────────────────────────────────────────────────────
void loop() {
  int packetSize = LoRa.parsePacket();

  if (packetSize > 0) {
    String incoming = "";
    while (LoRa.available()) {
      incoming += (char)LoRa.read();
    }

    int rssi = LoRa.packetRssi();
    Serial.println(incoming);

    if (parsePacket(incoming)) {
      lastPacketTime = millis();
      signalLost     = false;
      updateIndicators();
      updateLCD();
    } else {
      Serial.println(F("Error! Packet rejected"));
    }
  }

  // ── Signal timeout check ──────────────────────────────────────
  if (!signalLost && millis() - lastPacketTime > TIMEOUT_MS && lastPacketTime > 0) {
    signalLost = true;
    allLedsOff();
    noTone(BUZZER_PIN);
    updateLCD();  // shows NO SIGNAL
    Serial.println(F("[HOME] WARN: No packet received within timeout."));
  }
}
```

### Receiver — Line-by-line Explanation

1. `#include <SPI.h>` — SPI library used by LoRa module.
2. `#include <LoRa.h>` — LoRa library for radio functions.
3. `#include <Wire.h>` — I2C library used for the LCD.
4. `#include <LiquidCrystal_I2C.h>` — I2C LCD helper library.

// Pin definitions
5. `#define LORA_NSS 10` / `#define LORA_RST 9` / `#define LORA_DIO0 2` — LoRa pins (must match transmitter wiring).
6. `#define LED_RED 4` / `#define LED_YELLOW 5` / `#define LED_GREEN 6` — Status LEDs.
7. `#define BUZZER_PIN 7` — Buzzer pin for alerts.

// LoRa config
8. `#define LORA_FREQ 433E6` / `#define LORA_SF 9` / `#define LORA_BW 125E3` / `#define LORA_CR 5` — Radio parameters mirroring transmitter.

9. `LiquidCrystal_I2C lcd(0x27, 16, 2);` — Create LCD object at I2C address 0x27 (16x2 chars).

10. `#define TIMEOUT_MS 30000UL` — How long without packets before showing NO SIGNAL.
11. `unsigned long lastPacketTime = 0; bool signalLost = false;` — Track last packet time and signal state.

// Parsed sensor globals
12. `char soilStatus[8] = "---"; int soilLevel = 0; int soilRaw = 0; char solarSt[4] = "---"; int battPct = 0; float battV = 0.0f; float solarV = 0.0f;`
  — Buffers and numeric holders for parsed values.

// Helpers
13. `void setLEDs(bool red, bool yellow, bool green) { digitalWrite(...); }` — Convenience to set three LEDs atomically.
14. `void allLedsOff() { setLEDs(false,false,false); }` — Turn all LEDs off.
15. `void buzzWarning() { tone(BUZZER_PIN, 1200, 200); delay(250); tone(...); noTone(...); }` — Two short beeps for alerts.

16. `void updateIndicators() { allLedsOff(); if (strcmp(soilStatus, "DRY") == 0) { setLEDs(true,false,false); buzzWarning(); } ... }` — Map soil textual status to LEDs and buzzer.

17. `void updateLCD() { lcd.clear(); lcd.setCursor(0,0); if (signalLost) { lcd.print("  !! NO SIGNAL"); return; } ... lcd.print(line1); lcd.setCursor(0,1); lcd.print(line2); }`
  — Refresh the LCD: show NO SIGNAL when appropriate, otherwise show a compact two-line status containing soil, battery, and solar shorthand.

// Packet parser
18. `bool parsePacket(const String& data) { int p1 = data.indexOf('|'); int p2 = data.indexOf('|', p1+1); ... }`
  — Locate separators and validate that there are seven `|` separators. If any index < 0, reject the packet.
19. `unsigned long timestamp = data.substring(0, p1).toInt();` — Extract timestamp (unused elsewhere, but useful for logging/sync).
20. `soilLevel = data.substring(p1+1, p2).toInt();` — Parse soil percent integer.
21. `soilRaw = data.substring(p2+1, p3).toInt();` — Parse raw ADC value.
22. `strncpy(soilStatus, data.substring(p3+1, p4).c_str(), sizeof(soilStatus));` — Copy soil status text into buffer (safe-truncated).
23. `battPct = data.substring(p4+1, p5).toInt();` — Parse battery percent.
24. `strncpy(solarSt, data.substring(p5+1, p6).c_str(), sizeof(solarSt));` — Copy solar ON/OFF text.
25. `solarV = data.substring(p6+1, p7).toFloat(); battV = data.substring(p7+1).toFloat();` — Parse voltages.
26. `return true;` — Parsing succeeded.

// Setup & Loop
27. `void setup() { Serial.begin(9600); pinMode(...); allLedsOff(); Wire.begin(); lcd.init(); lcd.backlight(); lcd.print("  Waiting for  "); lcd.print("  field data.. "); LoRa.setPins(...); while (!LoRa.begin(LORA_FREQ) && retries-- > 0) ... }`
  — Configure IO, initialize LCD, start LoRa with retries, and set radio parameters including CRC.
28. `void loop() { int packetSize = LoRa.parsePacket(); if (packetSize > 0) { String incoming = ""; while (LoRa.available()) incoming += (char)LoRa.read(); ... } ... }`
  — On packet arrival, read all bytes into `incoming`, log RSSI, and call `parsePacket()`.
29. `if (parsePacket(incoming)) { lastPacketTime = millis(); signalLost = false; updateIndicators(); updateLCD(); }` — Update state and UI on successful parse.
30. `if (!signalLost && millis() - lastPacketTime > TIMEOUT_MS && lastPacketTime > 0) { signalLost = true; allLedsOff(); noTone(BUZZER_PIN); updateLCD(); }` — Timeout handler to switch to NO SIGNAL mode.

31. Notes:
   - `parsePacket()` uses `String` and `substring()` which are convenient but can fragment memory on low-RAM MCUs; for high-reliability, a fixed char buffer and `strtok()`-style parsing is more deterministic.
   - `strncpy()` is used to avoid buffer overruns; fields longer than the buffer will be truncated.

---