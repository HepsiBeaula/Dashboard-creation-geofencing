import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Rectangle, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import {
  Activity,
  MapPin,
  Radio,
  Satellite,
  ShieldCheck,
  ShieldAlert,
  Send,
  Wifi,
  WifiOff,
  Crosshair,
  Cpu,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

// Geofence bounds (matches ESP32 firmware)
const FENCE = {
  minLat: 29.855,
  maxLat: 29.8675,
  minLon: 77.889,
  maxLon: 77.9035,
};
const CENTER: [number, number] = [
  (FENCE.minLat + FENCE.maxLat) / 2,
  (FENCE.minLon + FENCE.maxLon) / 2,
];

// Fix default Leaflet marker icons (Vite/CDN)
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function insideCampus(lat: number, lon: number) {
  return (
    lat >= FENCE.minLat &&
    lat <= FENCE.maxLat &&
    lon >= FENCE.minLon &&
    lon <= FENCE.maxLon
  );
}

function FlyTo({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 16, { duration: 0.8 });
  }, [pos, map]);
  return null;
}

type LogEntry = {
  ts: number;
  lat: number;
  lon: number;
  inside: boolean;
  source: "device" | "manual" | "demo";
};

export function Dashboard() {
  const [deviceIp, setDeviceIp] = useState("192.168.1.100");
  const [connected, setConnected] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [latInput, setLatInput] = useState("29.8612");
  const [lonInput, setLonInput] = useState("77.8945");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sending, setSending] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [uptime, setUptime] = useState(0);
  const startedRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setUptime(Math.floor((Date.now() - startedRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const inside = useMemo(
    () => (coords ? insideCampus(coords.lat, coords.lon) : null),
    [coords],
  );

  async function pingDevice() {
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 3000);
      await fetch(`http://${deviceIp}/`, { mode: "no-cors", signal: ctrl.signal });
      clearTimeout(timeout);
      setConnected(true);
      toast.success("Device reachable", { description: `ESP32 at ${deviceIp}` });
    } catch {
      setConnected(false);
      toast.error("Device unreachable", {
        description: "Falling back to demo mode. Check IP / network / CORS.",
      });
    }
  }

  async function sendCoordinates() {
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      toast.error("Invalid coordinates");
      return;
    }
    setSending(true);
    const isInside = insideCampus(lat, lon);
    let source: LogEntry["source"] = demoMode ? "demo" : "manual";

    if (!demoMode) {
      try {
        const url = `http://${deviceIp}/update?lat=${lat}&lon=${lon}`;
        await fetch(url, { mode: "no-cors" });
        source = "device";
        setConnected(true);
      } catch {
        toast.error("Could not reach ESP32 — using demo result");
      }
    }

    setCoords({ lat, lon });
    setLastUpdate(Date.now());
    setLogs((prev) =>
      [{ ts: Date.now(), lat, lon, inside: isInside, source }, ...prev].slice(0, 12),
    );
    if (isInside) {
      toast.success("Inside geofence", { description: `${lat.toFixed(6)}, ${lon.toFixed(6)}` });
    } else {
      toast.warning("Outside geofence", { description: `${lat.toFixed(6)}, ${lon.toFixed(6)}` });
    }
    setSending(false);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return toast.error("Geolocation unavailable");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatInput(pos.coords.latitude.toFixed(6));
        setLonInput(pos.coords.longitude.toFixed(6));
        toast.success("Location captured");
      },
      () => toast.error("Permission denied"),
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/40">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Satellite className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">GeoFence Control</h1>
              <p className="text-xs text-muted-foreground">ESP32 GPS Geofencing · IIT Roorkee</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={
                "gap-1.5 border-border bg-card font-mono text-xs " +
                (connected ? "text-[color:var(--success)]" : "text-muted-foreground")
              }
            >
              <span
                className={
                  "inline-block h-1.5 w-1.5 rounded-full " +
                  (connected ? "bg-[color:var(--success)] animate-pulse" : "bg-muted-foreground/60")
                }
              />
              {connected ? "ONLINE" : "STANDBY"}
            </Badge>
            <Badge variant="outline" className="hidden gap-1.5 border-border bg-card font-mono text-xs sm:flex">
              <Clock className="h-3 w-3" /> {formatUptime(uptime)}
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Hero status */}
        <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  <Activity className="h-3 w-3" /> Live Status
                </div>
                <h2 className="text-3xl font-bold tracking-tight">
                  {coords === null
                    ? "Awaiting GPS Signal"
                    : inside
                      ? "Inside Campus Perimeter"
                      : "Outside Campus Perimeter"}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {coords === null
                    ? "Send coordinates below or connect to your ESP32 device to begin monitoring."
                    : `Last position evaluated against IIT Roorkee geofence at ${formatTime(lastUpdate)}.`}
                </p>
              </div>
              <StatusOrb state={coords === null ? "idle" : inside ? "inside" : "outside"} />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Metric
                label="Latitude"
                value={coords ? coords.lat.toFixed(6) : "—"}
                mono
              />
              <Metric
                label="Longitude"
                value={coords ? coords.lon.toFixed(6) : "—"}
                mono
              />
              <Metric
                label="Fence Status"
                value={
                  coords === null ? "—" : inside ? "INSIDE" : "OUTSIDE"
                }
                tone={coords === null ? "neutral" : inside ? "success" : "danger"}
              />
              <Metric
                label="Source"
                value={logs[0]?.source.toUpperCase() ?? "—"}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Device Connection</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="ip" className="text-xs text-muted-foreground">
                  ESP32 IP Address
                </Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    id="ip"
                    value={deviceIp}
                    onChange={(e) => setDeviceIp(e.target.value)}
                    placeholder="192.168.1.100"
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={pingDevice} aria-label="Ping device">
                    {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">Demo Mode</p>
                  <p className="text-xs text-muted-foreground">Simulate without hardware</p>
                </div>
                <Switch checked={demoMode} onCheckedChange={setDemoMode} />
              </div>

              <div className="rounded-lg bg-secondary/50 px-3 py-3 text-xs">
                <p className="mb-1.5 font-medium text-foreground">Endpoint</p>
                <code className="block break-all font-mono text-[11px] text-muted-foreground">
                  http://{deviceIp}/update?lat=&amp;lon=
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* Map + Control */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Geofence Map</h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm border border-primary bg-primary/15" />
                  Fence zone
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  Device
                </span>
              </div>
            </div>
            <div className="h-[460px] w-full">
              <MapContainer
                center={CENTER}
                zoom={15}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Rectangle
                  bounds={[
                    [FENCE.minLat, FENCE.minLon],
                    [FENCE.maxLat, FENCE.maxLon],
                  ]}
                  pathOptions={{
                    color: "#3b6fe0",
                    weight: 2,
                    fillColor: "#3b6fe0",
                    fillOpacity: 0.08,
                  }}
                />
                {coords && (
                  <Marker position={[coords.lat, coords.lon]} icon={markerIcon}>
                    <Popup>
                      <div className="font-mono text-xs">
                        {coords.lat.toFixed(6)}, {coords.lon.toFixed(6)}
                        <br />
                        {inside ? "Inside fence" : "Outside fence"}
                      </div>
                    </Popup>
                  </Marker>
                )}
                <FlyTo pos={coords ? [coords.lat, coords.lon] : null} />
              </MapContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="mb-4 flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Transmit Coordinates</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="lat" className="text-xs text-muted-foreground">
                    Latitude
                  </Label>
                  <Input
                    id="lat"
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    className="mt-1.5 font-mono text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="lon" className="text-xs text-muted-foreground">
                    Longitude
                  </Label>
                  <Input
                    id="lon"
                    value={lonInput}
                    onChange={(e) => setLonInput(e.target.value)}
                    className="mt-1.5 font-mono text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button onClick={sendCoordinates} disabled={sending} className="flex-1 gap-1.5">
                    <Send className="h-4 w-4" />
                    {sending ? "Sending…" : "Send to Device"}
                  </Button>
                  <Button variant="outline" size="icon" onClick={useMyLocation} aria-label="Use my location">
                    <Crosshair className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h3 className="mb-4 text-sm font-semibold">Fence Boundaries</h3>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <BoundCell label="Min Lat" value={FENCE.minLat} />
                <BoundCell label="Max Lat" value={FENCE.maxLat} />
                <BoundCell label="Min Lon" value={FENCE.minLon} />
                <BoundCell label="Max Lon" value={FENCE.maxLon} />
              </dl>
            </div>
          </div>
        </section>

        {/* Activity log */}
        <section className="mt-6 rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold">Activity Log</h3>
              <p className="text-xs text-muted-foreground">
                Recent geofence evaluations · newest first
              </p>
            </div>
            {logs.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setLogs([])}>
                Clear
              </Button>
            )}
          </div>
          {logs.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No transmissions yet. Send coordinates to populate the log.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {logs.map((l) => (
                <li key={l.ts} className="flex items-center justify-between px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={
                        "grid h-8 w-8 place-items-center rounded-lg " +
                        (l.inside
                          ? "bg-[color:var(--success)]/12 text-[color:var(--success)]"
                          : "bg-destructive/10 text-destructive")
                      }
                    >
                      {l.inside ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-mono text-sm">
                        {l.lat.toFixed(6)}, {l.lon.toFixed(6)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {l.inside ? "Inside fence" : "Outside fence"} · via {l.source}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatTime(l.ts)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-10 pb-8 text-center text-xs text-muted-foreground">
          GeoFence Control · Built for ESP32 + SSD1306 OLED · IIT Roorkee
        </footer>
      </main>
    </div>
  );
}

function StatusOrb({ state }: { state: "inside" | "outside" | "idle" }) {
  const colorMap = {
    inside: "bg-[color:var(--success)]",
    outside: "bg-destructive",
    idle: "bg-muted-foreground/40",
  } as const;
  return (
    <div className="relative">
      <div className={`relative h-16 w-16 rounded-full ${colorMap[state]} shadow-lg`}>
        <div className={`absolute inset-0 animate-ping rounded-full ${colorMap[state]} opacity-30`} />
        <div className="absolute inset-2 rounded-full bg-card/30 backdrop-blur-sm" />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  mono,
  tone = "neutral",
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "neutral" | "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-[color:var(--success)]"
      : tone === "danger"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${toneClass} ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function BoundCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-secondary/50 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm">{value.toFixed(4)}</dd>
    </div>
  );
}

function formatTime(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString();
}

function formatUptime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}