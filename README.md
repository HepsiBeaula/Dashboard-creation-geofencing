# ESP32 GPS Geofencing using Smartphone GPS, OLED Display, and Built-in RGB LED

## Overview

This project demonstrates a **GPS-based geofencing system using an ESP32** without requiring a dedicated GPS module. Instead, the ESP32 hosts a web server that receives GPS coordinates from a smartphone or laptop browser using the HTML5 Geolocation API. The received coordinates are compared against a predefined geofence representing the IIT Roorkee campus.
The software implementation combines embedded programming and web technologies to create a real-time GPS geofencing system. The ESP32 hosts a web server that receives GPS coordinates from a smartphone browser via the HTML5 Geolocation API, processes the location against predefined geofence boundaries, and updates the OLED display, built-in RGB LED, and serial monitor with the current geofence status.

The ESP32 provides real-time visual feedback through an OLED display and the built-in RGB NeoPixel LED.

---

## Features

* ESP32 Web Server
* Smartphone GPS integration using HTML5 Geolocation
* OLED display for GPS coordinates and geofence status
* Built-in RGB LED status indication
* IIT Roorkee geofence detection
* Real-time latitude and longitude monitoring
* Serial Monitor debugging
* Simple browser-based interface

---

## Working Principle

1. The ESP32 connects to the configured Wi-Fi network.
2. After connecting, it starts an HTTP web server.
3. A smartphone connected to the same Wi-Fi network opens the ESP32 web page.
4. The webpage requests the device's current GPS location using the browser's Geolocation API.
5. The GPS coordinates are transmitted to the ESP32 through an HTTP request.
6. The ESP32 compares the received latitude and longitude with predefined IIT Roorkee geofence boundaries.
7. The OLED display and built-in RGB LED are updated according to the geofence status.

---

## Geofence Coordinates

### IIT Roorkee Boundary

Latitude

* Minimum: 29.8550
* Maximum: 29.8675

Longitude

* Minimum: 77.8890
* Maximum: 77.9035

If the received coordinates fall within these limits, the user is considered to be inside the campus.

---

## Built-in RGB LED Indication

| LED Color | Status              |
| --------- | ------------------- |
| 🔵 Blue   | Waiting for GPS     |
| 🟢 Green  | Inside IIT Roorkee  |
| 🔴 Red    | Outside IIT Roorkee |

---

## OLED Display

The OLED displays:

* Latitude
* Longitude
* Current Geofence Status

Example:

```
GPS Geofencing

Lat: 29.861245

Lon: 77.896521

INSIDE
```

---

## Web Interface

The ESP32 serves a simple webpage that contains:

* A button to request the device's GPS location.
* JavaScript using the HTML5 Geolocation API.
* Live display of latitude and longitude.
* Communication with the ESP32 using HTTP GET requests.

Example request:

```
http://ESP32_IP/update?lat=29.861245&lon=77.896521
```

---

## Hardware Requirements

* ESP32 Development Board
* SSD1306 OLED Display (128×64)
* USB Cable
* Wi-Fi Network
* Smartphone or Laptop with GPS-enabled browser

---

## Software Requirements

* Arduino IDE
* ESP32 Board Package
* Adafruit SSD1306 Library
* Adafruit GFX Library
* Adafruit NeoPixel Library

---

## Libraries Used

```cpp
WiFi.h
WebServer.h
Wire.h
Adafruit_GFX.h
Adafruit_SSD1306.h
Adafruit_NeoPixel.h
```

---

## Project Flow

```
Smartphone GPS
        │
        ▼
HTML5 Geolocation API
        │
        ▼
ESP32 Web Server
        │
        ▼
Receive Latitude & Longitude
        │
        ▼
Geofence Detection
        │
 ┌──────┴─────────┐
 │                │
 ▼                ▼
OLED          RGB LED
Display       Status
```

---

## Applications

* Campus Entry Monitoring
* Employee Attendance Verification
* Smart Campus Projects
* Vehicle Geofencing
* Asset Tracking
* Fleet Management
* IoT Location-Based Automation
* Student Safety Monitoring

---

## Current Limitations

* Requires both the ESP32 and smartphone to be connected to the same Wi-Fi network.
* Depends on browser support for the HTML5 Geolocation API.
* Some browsers restrict location access on HTTP pages.
* GPS accuracy depends on the smartphone's GPS hardware.

---

## Future Improvements

* HTTPS support for improved browser compatibility.
* Automatic location updates without requiring user interaction.
* Google Maps integration.
* MQTT-based GPS transmission.
* Firebase cloud logging.
* Multi-user geofence monitoring.
* GPS route history.
* Mobile application integration.
* Push notifications for entry and exit events.

---

## Author

1.Dr.M.Parimala Devi
2.Dr.S.Balakrishnan
3.Mr.M.Natarayan
4.Dr.M.J.Hepsi Beaula
5.Ms.M.Kanimozhi
6.Ms.R.Vijayalakshmi

 
