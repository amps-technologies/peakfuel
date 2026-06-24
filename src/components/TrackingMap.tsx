"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const STORE_LAT = parseFloat(process.env.NEXT_PUBLIC_STORE_LAT ?? "14.5995");
const STORE_LNG = parseFloat(process.env.NEXT_PUBLIC_STORE_LNG ?? "120.9842");
const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME ?? "GasGo Depot";
const ORS_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY ?? "";

const storeIcon = L.divIcon({
  html: `
    <div style="background:#0ea5e9;width:32px;height:32px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);
      display:flex;align-items:center;justify-content:center;">
      <span style="transform:rotate(45deg);font-size:14px;line-height:1">🏪</span>
    </div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const destIcon = L.divIcon({
  html: `
    <div style="background:#ef4444;width:32px;height:32px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);
      display:flex;align-items:center;justify-content:center;">
      <span style="transform:rotate(45deg);font-size:14px;line-height:1">📍</span>
    </div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const truckIcon = L.divIcon({
  html: `
    <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center">
      <div style="position:absolute;width:44px;height:44px;border-radius:50%;
        background:rgba(37,99,235,0.15);animation:tPulse 1.8s ease-out infinite;"></div>
      <div style="position:relative;width:30px;height:30px;border-radius:50%;
        background:#2563eb;border:3px solid #fff;box-shadow:0 2px 8px rgba(37,99,235,0.5);
        display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;">🚚</div>
    </div>
    <style>@keyframes tPulse{0%{transform:scale(0.5);opacity:1}100%{transform:scale(1.8);opacity:0}}</style>`,
  className: "",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

interface Props {
  riderLat: number | null;
  riderLng: number | null;
  destLat?: number | null;
  destLng?: number | null;
}

export default function TrackingMap({
  riderLat,
  riderLng,
  destLat,
  destLng,
}: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const passedLayerRef = useRef<L.Polyline | null>(null);
  const remainLayerRef = useRef<L.Polyline | null>(null);
  const fullRouteRef = useRef<[number, number][]>([]);
  const riderPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const initialFitDone = useRef(false);

  const hasDestination = !!(
    destLat &&
    destLng &&
    destLat !== 0 &&
    destLng !== 0 &&
    !isNaN(destLat) &&
    !isNaN(destLng)
  );

  // Split and redraw route based on current rider position
  const updateRouteSplit = (map: L.Map) => {
    const route = fullRouteRef.current;
    const rider = riderPosRef.current;
    if (route.length < 2) return;

    // Remove existing route layers
    if (passedLayerRef.current) {
      map.removeLayer(passedLayerRef.current);
      passedLayerRef.current = null;
    }
    if (remainLayerRef.current) {
      map.removeLayer(remainLayerRef.current);
      remainLayerRef.current = null;
    }

    if (!rider) {
      // No rider yet — draw full route as blue dashed
      remainLayerRef.current = L.polyline(
        route.map(([lat, lng]) => ({ lat, lng })),
        { color: "#1d4ed8", weight: 5, opacity: 0.75, dashArray: "10, 6" },
      ).addTo(map);
      return;
    }

    // Find closest point on route to rider
    let closestIdx = 0;
    let minDist = Infinity;
    route.forEach(([lat, lng], i) => {
      const d = Math.hypot(lat - rider.lat, lng - rider.lng);
      if (d < minDist) {
        minDist = d;
        closestIdx = i;
      }
    });

    const passed = route.slice(0, closestIdx + 1);
    const remain = route.slice(closestIdx);

    // Passed — solid grey
    if (passed.length > 1) {
      passedLayerRef.current = L.polyline(
        passed.map(([lat, lng]) => ({ lat, lng })),
        { color: "#9ca3af", weight: 5, opacity: 0.7 },
      ).addTo(map);
    }

    // Remaining — deep blue dashed
    if (remain.length > 1) {
      remainLayerRef.current = L.polyline(
        remain.map(([lat, lng]) => ({ lat, lng })),
        { color: "#1d4ed8", weight: 5, opacity: 0.85, dashArray: "10, 6" },
      ).addTo(map);
    }
  };

  // Init map
  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: [STORE_LAT, STORE_LNG],
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map,
    );
    mapRef.current = map;

    // Store marker
    L.marker([STORE_LAT, STORE_LNG], { icon: storeIcon })
      .addTo(map)
      .bindPopup(`<strong>${STORE_NAME}</strong>`);

    // Destination marker
    if (hasDestination && destLat && destLng) {
      L.marker([destLat, destLng], { icon: destIcon })
        .addTo(map)
        .bindPopup("<strong>Delivery address</strong>");
    }

    // Fetch and draw initial route
    if (hasDestination && destLat && destLng && ORS_KEY) {
      const fetchRoute = async () => {
        try {
          const res = await fetch(
            "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: ORS_KEY,
              },
              body: JSON.stringify({
                coordinates: [
                  [STORE_LNG, STORE_LAT],
                  [destLng, destLat],
                ],
              }),
            },
          );
          if (!res.ok) return;
          const data = (await res.json()) as {
            features?: { geometry: { coordinates: [number, number][] } }[];
          };
          const coords = data?.features?.[0]?.geometry?.coordinates;
          if (!coords?.length) return;

          // Store full route as [lat, lng] pairs
          fullRouteRef.current = coords.map(
            ([lng, lat]) => [lat, lng] as [number, number],
          );

          // Draw split (handles case where rider is already moving)
          updateRouteSplit(map);

          // Fit bounds to show full route
          if (!initialFitDone.current && !riderPosRef.current) {
            map.fitBounds(L.latLngBounds(fullRouteRef.current), {
              padding: [50, 50],
              animate: true,
            });
          }
        } catch {
          // Silently fail — map still works without route line
        }
      };
      fetchRoute();
    } else if (hasDestination && destLat && destLng) {
      // No ORS key — fit to store + dest
      map.fitBounds(
        L.latLngBounds([
          [STORE_LAT, STORE_LNG],
          [destLat, destLng],
        ]),
        { padding: [50, 50], animate: false },
      );
    }

    return () => {
      map.remove();
      mapRef.current = null;
      riderMarkerRef.current = null;
      passedLayerRef.current = null;
      remainLayerRef.current = null;
      fullRouteRef.current = [];
      riderPosRef.current = null;
      initialFitDone.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update rider position
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !riderLat || !riderLng) return;

    // Store latest rider position in ref so route split always has it
    riderPosRef.current = { lat: riderLat, lng: riderLng };

    // Create or move rider marker
    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng([riderLat, riderLng]);
    } else {
      riderMarkerRef.current = L.marker([riderLat, riderLng], {
        icon: truckIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup("🚚 Rider is here");
    }

    // Fit bounds on first GPS fix
    if (!initialFitDone.current) {
      const points: [number, number][] = [
        [STORE_LAT, STORE_LNG],
        [riderLat, riderLng],
      ];
      if (hasDestination && destLat && destLng) points.push([destLat, destLng]);
      map.fitBounds(L.latLngBounds(points), {
        padding: [60, 60],
        animate: true,
      });
      initialFitDone.current = true;
    }

    // Redraw split route
    updateRouteSplit(map);

    // Gentle pan if rider near viewport edge
    const b = map.getBounds();
    const ns = (b.getNorth() - b.getSouth()) * 0.2;
    const ew = (b.getEast() - b.getWest()) * 0.2;
    const inner = L.latLngBounds(
      [b.getSouth() + ns, b.getWest() + ew],
      [b.getNorth() - ns, b.getEast() - ew],
    );
    if (!inner.contains(L.latLng(riderLat, riderLng))) {
      map.panTo([riderLat, riderLng], { animate: true, duration: 1 });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riderLat, riderLng]);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <div
        ref={mapDivRef}
        style={{ height: "100%", width: "100%", borderRadius: "12px" }}
      />
      <style>{`.leaflet-control-attribution { display: none !important; }`}</style>
    </div>
  );
}
