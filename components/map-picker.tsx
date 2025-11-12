"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void
  initialLat?: number
  initialLng?: number
}

export function MapPicker({ onLocationSelect, initialLat = 0.3476, initialLng = 32.5825 }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null,
  )

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return

    // Dynamically import Leaflet
    import("leaflet").then((L) => {
      // Fix for default marker icon
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      // Initialize map
      const mapInstance = L.map(mapRef.current!).setView([initialLat, initialLng], 16)

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstance)

      // Add marker if initial location provided
      let markerInstance: any = null
      if (initialLat && initialLng) {
        markerInstance = L.marker([initialLat, initialLng]).addTo(mapInstance)
      }

      // Add click event to place marker
      mapInstance.on("click", (e: any) => {
        const { lat, lng } = e.latlng

        // Remove existing marker
        if (markerInstance) {
          mapInstance.removeLayer(markerInstance)
        }

        // Add new marker
        markerInstance = L.marker([lat, lng]).addTo(mapInstance)
        setMarker(markerInstance)
        setSelectedLocation({ lat, lng })
      })

      setMap(mapInstance)
      setMarker(markerInstance)

      // Cleanup
      return () => {
        mapInstance.remove()
      }
    })
  }, [initialLat, initialLng])

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation.lat, selectedLocation.lng)
    }
  }

  return (
    <div className="space-y-4">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div ref={mapRef} className="h-[400px] w-full rounded-lg border" />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedLocation ? (
            <>
              <MapPin className="inline h-4 w-4 mr-1" />
              Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </>
          ) : (
            "Click on the map to select a location"
          )}
        </p>
        <Button onClick={handleConfirmLocation} disabled={!selectedLocation}>
          Confirm Location
        </Button>
      </div>
    </div>
  )
}
