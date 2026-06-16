"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, Locate, X } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  onConfirm: (address: string, lat: number, lng: number) => void;
  onClose: () => void;
}

export default function LocationPicker({ onConfirm, onClose }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [address, setAddress] = useState("");
  const [pinLat, setPinLat] = useState<number | null>(null);
  const [pinLng, setPinLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      );
      const data = (await res.json()) as { display_name?: string };
      setAddress(data.display_name ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } catch {
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setLoading(false);
    }
  };

  const placeMarker = (map: L.Map, lat: number, lng: number) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }
    setPinLat(lat);
    setPinLng(lng);
    reverseGeocode(lat, lng);
  };

  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;

    // Fix default marker icons
    const iconProto = L.Icon.Default.prototype as unknown as Record<
      string,
      unknown
    >;
    delete iconProto._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const map = L.map(mapDivRef.current, {
      center: [14.5995, 120.9842],
      zoom: 13,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      placeMarker(map, lat, lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const map = mapRef.current;
        if (!map) {
          setLocating(false);
          return;
        }
        map.flyTo([lat, lng], 16, { animate: true, duration: 1 });
        placeMarker(map, lat, lng);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleConfirm = () => {
    if (!pinLat || !pinLng || !address) return;
    onConfirm(address, pinLat, pinLng);
  };

  return (
    <div className="fixed inset-0 z-200 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white w-full sm:w-135 sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <MapPin size={16} className="text-sky-500" />
            Pin your delivery location
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Map */}
        <div className="relative" style={{ height: 320 }}>
          <div ref={mapDivRef} style={{ height: "100%", width: "100%" }} />

          {/* Use my location button */}
          <button
            onClick={useMyLocation}
            disabled={locating}
            className="absolute top-3 right-3 z-1000 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-sky-50 hover:border-sky-300 cursor-pointer transition-colors disabled:opacity-60"
          >
            <Locate size={13} className="text-sky-500" />
            {locating ? "Locating..." : "Use my location"}
          </button>

          {/* Hint — shown before pin is dropped */}
          {!pinLat && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-999">
              <div className="bg-white/90 px-4 py-2 rounded-xl text-sm text-gray-500 shadow-sm">
                Tap the map to drop a pin
              </div>
            </div>
          )}
        </div>

        {/* Address preview + confirm */}
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              Getting address...
            </div>
          ) : address ? (
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-3">
              <p className="text-xs text-sky-600 font-medium mb-1">
                📍 Pinned location
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{address}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-1">
              Tap anywhere on the map to set your delivery location
            </p>
          )}

          <button
            onClick={handleConfirm}
            disabled={!pinLat || !address || loading}
            className="w-full py-2.5 bg-sky-500 text-white rounded-xl font-medium text-sm hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Confirm this location
          </button>
        </div>
      </div>
    </div>
  );
}
