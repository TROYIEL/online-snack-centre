"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface DeliveryMapProps {
  deliveryId: string
  deliveryLat?: number
  deliveryLng?: number
  currentLat?: number
  currentLng?: number
}

export function DeliveryMap({
  deliveryId,
  deliveryLat = 0.3476,
  deliveryLng = 32.5825,
  currentLat,
  currentLng,
}: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [deliveryMarker, setDeliveryMarker] = useState<any>(null)
  const [currentMarker, setCurrentMarker] = useState<any>(null)

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
      const mapInstance = L.map(mapRef.current!).setView([deliveryLat, deliveryLng], 15)

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstance)

      // Create custom icons
      const deliveryIcon = L.divIcon({
        html: '<div style="background-color: #10b981; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        className: "",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      const currentIcon = L.divIcon({
        html: '<div style="background-color: #3b82f6; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        className: "",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      // Add delivery destination marker
      const deliveryMarkerInstance = L.marker([deliveryLat, deliveryLng], { icon: deliveryIcon })
        .addTo(mapInstance)
        .bindPopup("Delivery Destination")

      // Add current location marker if available
      let currentMarkerInstance: any = null
      if (currentLat && currentLng) {
        currentMarkerInstance = L.marker([currentLat, currentLng], { icon: currentIcon })
          .addTo(mapInstance)
          .bindPopup("Current Location")

        // Fit bounds to show both markers
        const bounds = L.latLngBounds([
          [deliveryLat, deliveryLng],
          [currentLat, currentLng],
        ])
        mapInstance.fitBounds(bounds, { padding: [50, 50] })
      }

      setMap(mapInstance)
      setDeliveryMarker(deliveryMarkerInstance)
      setCurrentMarker(currentMarkerInstance)

      // Subscribe to real-time location updates
      const supabase = createClient()
      const channel = supabase
        .channel(`delivery-${deliveryId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "deliveries",
            filter: `id=eq.${deliveryId}`,
          },
          (payload: any) => {
            const { current_latitude, current_longitude } = payload.new
            if (current_latitude && current_longitude) {
              // Update current location marker
              if (currentMarkerInstance) {
                currentMarkerInstance.setLatLng([current_latitude, current_longitude])
              } else {
                currentMarkerInstance = L.marker([current_latitude, current_longitude], { icon: currentIcon })
                  .addTo(mapInstance)
                  .bindPopup("Current Location")
                setCurrentMarker(currentMarkerInstance)
              }

              // Fit bounds to show both markers
              const bounds = L.latLngBounds([
                [deliveryLat, deliveryLng],
                [current_latitude, current_longitude],
              ])
              mapInstance.fitBounds(bounds, { padding: [50, 50] })
            }
          },
        )
        .subscribe()

      // Cleanup
      return () => {
        channel.unsubscribe()
        mapInstance.remove()
      }
    })
  }, [deliveryId, deliveryLat, deliveryLng, currentLat, currentLng])

  return (
    <div className="space-y-4">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div ref={mapRef} className="h-[400px] w-full rounded-lg border" />
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-emerald-500 border-2 border-white shadow" />
          <span>Delivery Destination</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow" />
          <span>Current Location</span>
        </div>
      </div>
    </div>
  )
}
