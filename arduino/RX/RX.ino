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