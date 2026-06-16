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

// Store icon
const storeIcon = L.divIcon({
  html: `
    <div style="
      background:#f97316;
      width:32px;height:32px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    ">
      <span style="transform:rotate(45deg);font-size:14px;line-height:1">🏪</span>
    </div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Destination icon
const destIcon = L.divIcon({
  html: `
    <div style="
      background:#ef4444;
      width:32px;height:32px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    ">
      <span style="transform:rotate(45deg);font-size:14px;line-height:1">📍</span>
    </div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Truck / rider icon — animated pulse ring
const truckIcon = L.divIcon({
  html: `
    <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center">
      <div style="
        position:absolute;
        width:44px;height:44px;
        border-radius:50%;
        background:rgba(37,99,235,0.15);
        animation:truckPulse 1.8s ease-out infinite;
      "></div>
      <div style="
        position:relative;
        width:30px;height:30px;
        border-radius:50%;
        background:#2563eb;
        border:3px solid #fff;
        box-shadow:0 2px 8px rgba(37,99,235,0.5);
        display:flex;align-items:center;justify-content:center;
        font-size:16px;line-height:1;
      ">🚚</div>
    </div>
    <style>
      @keyframes truckPulse {
        0%   { transform:scale(0.5); opacity:1   }
        100% { transform:scale(1.8); opacity:0   }
      }
    </style>`,
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
  const initialFitDone = useRef(false);

  const hasDestination = !!(
    destLat &&
    destLng &&
    destLat !== 0 &&
    destLng !== 0 &&
    !isNaN(destLat) &&
    !isNaN(destLng)
  );

  // Init map
  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: [STORE_LAT, STORE_LNG],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Store marker
    L.marker([STORE_LAT, STORE_LNG], { icon: storeIcon })
      .addTo(map)
      .bindPopup(`<strong>${STORE_NAME}</strong><br>Order origin`);

    // Destination marker
    if (hasDestination && destLat && destLng) {
      L.marker([destLat, destLng], { icon: destIcon })
        .addTo(map)
        .bindPopup("<strong>Delivery address</strong>");
    }

    mapRef.current = map;

    const drawInitialRoute = async (
      map: L.Map,
      toLat: number,
      toLng: number,
    ) => {
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
                [toLng, toLat],
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

        const latLngs = coords.map(
          ([lng, lat]) => [lat, lng] as [number, number],
        );
        fullRouteRef.current = latLngs;

        // Full route — deep blue dashed
        remainLayerRef.current = L.polyline(
          latLngs.map(([lat, lng]) => ({ lat, lng })),
          {
            color: "#1d4ed8",
            weight: 5,
            opacity: 0.75,
            dashArray: "10, 6",
          },
        ).addTo(map);

        // Fit full route into view
        map.fitBounds(L.latLngBounds(latLngs), {
          padding: [50, 50],
          animate: true,
        });
      } catch {
        // Silently fail
      }
    };

    // Draw initial route if we have destination
    if (hasDestination && destLat && destLng && ORS_KEY) {
      drawInitialRoute(map, destLat, destLng);
    } else if (hasDestination && destLat && destLng) {
      // No ORS key — fit to show store and destination
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
      initialFitDone.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update rider marker and route split when coords change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !riderLat || !riderLng) return;

    // Create or update truck marker
    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng([riderLat, riderLng]);
    } else {
      riderMarkerRef.current = L.marker([riderLat, riderLng], {
        icon: truckIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup("🚚 Rider is here");

      // First GPS fix — fit all points into view
      if (!initialFitDone.current) {
        const points: [number, number][] = [
          [STORE_LAT, STORE_LNG],
          [riderLat, riderLng],
        ];
        if (hasDestination && destLat && destLng) {
          points.push([destLat, destLng]);
        }
        map.fitBounds(L.latLngBounds(points), {
          padding: [60, 60],
          animate: true,
        });
        initialFitDone.current = true;
      }
    }

    // Split route into passed (grey) and remaining (blue)
    const route = fullRouteRef.current;
    if (route.length > 1) {
      // Find closest point on route to rider
      let closestIdx = 0;
      let minDist = Infinity;
      route.forEach(([lat, lng], i) => {
        const d = Math.hypot(lat - riderLat, lng - riderLng);
        if (d < minDist) {
          minDist = d;
          closestIdx = i;
        }
      });

      const passed = route.slice(0, closestIdx + 1);
      const remain = route.slice(closestIdx);

      // Remove old layers
      if (passedLayerRef.current) map.removeLayer(passedLayerRef.current);
      if (remainLayerRef.current) map.removeLayer(remainLayerRef.current);

      // Passed — solid grey
      if (passed.length > 1) {
        passedLayerRef.current = L.polyline(
          passed.map(([lat, lng]) => ({ lat, lng })),
          { color: "#6b7280", weight: 5, opacity: 0.6 },
        ).addTo(map);
      }

      // Remaining — deep blue dashed (very visible against orange OSM roads)
      if (remain.length > 1) {
        remainLayerRef.current = L.polyline(
          remain.map(([lat, lng]) => ({ lat, lng })),
          {
            color: "#1d4ed8",
            weight: 5,
            opacity: 0.85,
            dashArray: "10, 6",
          },
        ).addTo(map);
      }
    }

    // Pan to keep rider visible — only if near edge
    const bounds = map.getBounds();
    const riderLatLng = L.latLng(riderLat, riderLng);
    const ns = (bounds.getNorth() - bounds.getSouth()) * 0.2;
    const ew = (bounds.getEast() - bounds.getWest()) * 0.2;
    const inner = L.latLngBounds(
      [bounds.getSouth() + ns, bounds.getWest() + ew],
      [bounds.getNorth() - ns, bounds.getEast() - ew],
    );
    if (!inner.contains(riderLatLng)) {
      map.panTo(riderLatLng, { animate: true, duration: 1 });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riderLat, riderLng]);

  return (
    <div
      ref={mapDivRef}
      style={{ height: "100%", width: "100%", borderRadius: "12px" }}
    />
  );
}
