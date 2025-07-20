import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import { MapPin, Navigation, Car, Clock, IndianRupee } from 'lucide-react'
import { ParkingSpace, Location } from '../types'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom icons
const userLocationIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMzQjgyRjYiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const parkingIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjMTBCOTgxIi8+CjxyZWN0IHg9IjgiIHk9IjEwIiB3aWR0aD0iOCIgaGVpZ2h0PSI0IiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSIxMiIgeT0iMTMiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmaWxsPSIjMTBCOTgxIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QPC90ZXh0Pgo8L3N2Zz4=',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
})

interface MapProps {
  parkingSpaces: ParkingSpace[]
  userLocation?: Location
  onLocationChange?: (location: Location) => void
  onSpaceSelect?: (space: ParkingSpace) => void
  selectedSpace?: ParkingSpace | null
  className?: string
}

// Component to handle map events
const MapEvents: React.FC<{
  onLocationChange?: (location: Location) => void
}> = ({ onLocationChange }) => {
  const map = useMap()

  useEffect(() => {
    const handleLocationFound = (e: any) => {
      if (onLocationChange) {
        onLocationChange({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        })
      }
    }

    map.on('locationfound', handleLocationFound)

    return () => {
      map.off('locationfound', handleLocationFound)
    }
  }, [map, onLocationChange])

  return null
}

const Map: React.FC<MapProps> = ({
  parkingSpaces,
  userLocation,
  onLocationChange,
  onSpaceSelect,
  selectedSpace,
  className = '',
}) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(userLocation || null)
  const [isLocating, setIsLocating] = useState(false)
  const mapRef = useRef<any>(null)

  // Default center (Delhi, India)
  const defaultCenter: [number, number] = [28.6139, 77.2090]
  const center: [number, number] = currentLocation 
    ? [currentLocation.latitude, currentLocation.longitude]
    : defaultCenter

  const getCurrentLocation = () => {
    setIsLocating(true)
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
          setCurrentLocation(location)
          if (onLocationChange) {
            onLocationChange(location)
          }
          
          // Center map on user location
          if (mapRef.current) {
            mapRef.current.setView([location.latitude, location.longitude], 15)
          }
          setIsLocating(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          setIsLocating(false)
          alert('Unable to get your location. Please enable location services.')
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      )
    } else {
      alert('Geolocation is not supported by this browser.')
      setIsLocating(false)
    }
  }

  const formatDistance = (space: ParkingSpace) => {
    if (!currentLocation) return ''
    
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      space.latitude,
      space.longitude
    )
    
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  return (
    <div className={`relative ${className}`}>
      {/* Location Button */}
      <button
        onClick={getCurrentLocation}
        disabled={isLocating}
        className="absolute top-4 right-4 z-[1000] bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-md transition-colors disabled:opacity-50"
        title="Get current location"
      >
        {isLocating ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        ) : (
          <Navigation className="h-5 w-5 text-gray-600" />
        )}
      </button>

      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full rounded-lg"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEvents onLocationChange={onLocationChange} />

        {/* User Location Marker */}
        {currentLocation && (
          <Marker
            position={[currentLocation.latitude, currentLocation.longitude]}
            icon={userLocationIcon}
          >
            <Popup>
              <div className="text-center">
                <MapPin className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                <p className="font-medium">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Parking Space Markers */}
        {parkingSpaces.map((space) => (
          <Marker
            key={space.id}
            position={[space.latitude, space.longitude]}
            icon={parkingIcon}
            eventHandlers={{
              click: () => {
                if (onSpaceSelect) {
                  onSpaceSelect(space)
                }
              },
            }}
          >
            <Popup>
              <div className="min-w-[250px] p-2">
                <h3 className="font-semibold text-lg mb-2">{space.title}</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{space.address}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Car className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 capitalize">{space.space_type}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-green-600">{space.available_slots} available</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">₹{space.hourly_rate}/hour</span>
                  </div>

                  {currentLocation && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{formatDistance(space)} away</span>
                    </div>
                  )}
                </div>

                {space.description && (
                  <p className="text-gray-600 text-sm mt-2 border-t pt-2">
                    {space.description}
                  </p>
                )}

                {space.amenities && space.amenities.length > 0 && (
                  <div className="mt-2 border-t pt-2">
                    <p className="text-xs text-gray-500 mb-1">Amenities:</p>
                    <div className="flex flex-wrap gap-1">
                      {space.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => onSpaceSelect && onSpaceSelect(space)}
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                >
                  Book This Space
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default Map