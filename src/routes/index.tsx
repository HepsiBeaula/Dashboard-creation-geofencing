import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/geofence/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GeoFence Control — ESP32 GPS Geofencing Dashboard" },
      { name: "description", content: "Professional monitoring dashboard for ESP32-based GPS geofencing at IIT Roorkee." },
      { property: "og:title", content: "GeoFence Control" },
      { property: "og:description", content: "Real-time GPS geofence monitoring for ESP32 devices." },
    ],
  }),
  component: Index,
});

function Index() {
  return <Dashboard />;
}
