#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_NeoPixel.h>

//================ Wi-Fi Credentials ================
const char* ssid = "Hepsi";
const char* password = "123456789";

//================ OLED =============================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

//================ Built-in RGB LED =================
#define LED_PIN 2

Adafruit_NeoPixel pixel(1, LED_PIN, NEO_GRB + NEO_KHZ800);

//================ Web Server =======================
WebServer server(80);

//================ IIT Roorkee Geofence =============
const double minLat = 29.8550;
const double maxLat = 29.8675;

const double minLon = 77.8890;
const double maxLon = 77.9035;

//================ Global Variables =================
double latitude = 0.0;
double longitude = 0.0;
String statusText = "Waiting GPS";

//===================================================
// OLED Display Function
//===================================================
void updateOLED()
{
  display.clearDisplay();

  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0,0);
  display.println("GPS Geofencing");

  display.setCursor(0,16);
  display.print("Lat: ");
  display.println(latitude,6);

  display.setCursor(0,30);
  display.print("Lon: ");
  display.println(longitude,6);

  display.setCursor(0,48);

  if(statusText == "INSIDE IIT ROORKEE")
    display.println("INSIDE");
  else if(statusText == "OUTSIDE IIT ROORKEE")
    display.println("OUTSIDE");
  else
    display.println(statusText);

  display.display();
}

//===================================================
// Check whether GPS location is inside campus
//===================================================
bool insideCampus(double lat, double lon)
{
  return (lat >= minLat &&
          lat <= maxLat &&
          lon >= minLon &&
          lon <= maxLon);
}

//===================================================
// Built-in RGB LED Functions
//===================================================
void insideLED()
{
  // Green
  pixel.setPixelColor(0, pixel.Color(0,255,0));
  pixel.show();
}

void outsideLED()
{
  // Red
  pixel.setPixelColor(0, pixel.Color(255,0,0));
  pixel.show();
}

void waitingLED()
{
  // Blue
  pixel.setPixelColor(0, pixel.Color(0,0,255));
  pixel.show();
}

//===================================================
// Home Page
//===================================================
void handleRoot()
{
String html = R"rawliteral(
<!DOCTYPE html>
<html>

<head>
<title>ESP32 GPS Geofence</title>

<meta name="viewport" content="width=device-width, initial-scale=1">

<style>

body{
font-family:Arial;
text-align:center;
margin-top:30px;
}

button{
padding:15px;
font-size:20px;
}

</style>

</head>

<body>

<h2>ESP32 GPS Geofencing</h2>

<button onclick="getLocation()">
Send Current Location
</button>

<p id="status"></p>

<script>

function getLocation()
{

if(navigator.geolocation)
{

navigator.geolocation.getCurrentPosition(showPosition,error);

}
else
{

document.getElementById("status").innerHTML="GPS Not Supported";

}

}

function showPosition(position)
{

let lat=position.coords.latitude;
let lon=position.coords.longitude;

document.getElementById("status").innerHTML=
"Latitude : "+lat+
"<br>Longitude : "+lon;

fetch("/update?lat="+lat+"&lon="+lon)
.then(response=>response.text())
.then(data=>{

document.getElementById("status").innerHTML+="<br><br>"+data;

});

}

function error(err)
{

document.getElementById("status").innerHTML="Location Permission Denied";
"Error : " + err.message;

}

</script>

</body>

</html>
)rawliteral";

server.send(200,"text/html",html);

}//===================================================
// Update GPS Coordinates
//===================================================
void handleUpdate()
{
  if(!(server.hasArg("lat") && server.hasArg("lon")))
  {
    server.send(400,"text/plain","Missing Parameters");
    return;
  }

  latitude = server.arg("lat").toFloat();
  longitude = server.arg("lon").toFloat();

  if(latitude < -90 || latitude > 90 ||
     longitude < -180 || longitude > 180)
  {
    server.send(400,"text/plain","Invalid GPS");
    return;
  }

  Serial.println("--------------------------------");
  Serial.print("Latitude : ");
  Serial.println(latitude,6);

  Serial.print("Longitude: ");
  Serial.println(longitude,6);

  if(insideCampus(latitude,longitude))
  {
    Serial.println("INSIDE CAMPUS");
    insideLED();
    server.send(200,"text/plain","STATUS : INSIDE CAMPUS");
  }
  else
  {
    Serial.println("OUTSIDE CAMPUS");
    outsideLED();
    server.send(200,"text/plain","STATUS : OUTSIDE CAMPUS");
  }

  updateOLED();
}

//===================================================
// Setup
//===================================================
void setup()
{
  Serial.begin(115200);

  // Built-in RGB LED
  pixel.begin();
  pixel.setBrightness(50);
  pixel.setPixelColor(0, pixel.Color(0,0,0));
  pixel.show();

  // OLED
  Wire.begin();

  if(!display.begin(SSD1306_SWITCHCAPVCC,0x3D))
  {
    Serial.println("OLED Failed");
    while(true);
  }

  display.clearDisplay();
  display.display();

  updateOLED();
  waitingLED();

  Serial.println("Connecting WiFi...");
statusText = "Connecting WiFi";
updateOLED();
statusText = "Waiting GPS";
updateOLED();
  WiFi.begin(ssid,password);

  while(WiFi.status()!=WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi Connected");

  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  server.on("/", handleRoot);
  server.on("/update", handleUpdate);

  server.begin();

  Serial.println("HTTP Server Started");
}

//===================================================
// Loop
//===================================================
void loop()
{
  server.handleClient();
}
