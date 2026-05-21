export interface ParsedAddress {
  full_address: string
  addressLine1: string
  city: string
  state: string
  country: string
  pincode: string
  latitude: number | null
  longitude: number | null
}

let loadPromise: Promise<void> | null = null

export function getGoogleMapsApiKey(): string {
  return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() ?? ''
}

export function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key is not configured (VITE_GOOGLE_MAPS_API_KEY)'))
  }
  if (window.google?.maps?.places) {
    return Promise.resolve()
  }
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-maps]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')))
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`
    script.async = true
    script.defer = true
    script.dataset.googleMaps = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })

  return loadPromise
}

function componentValue(
  components: google.maps.places.PlaceResult['address_components'],
  type: string,
  useShort = false
): string {
  const match = components?.find((c) => c.types.includes(type))
  if (!match) return ''
  return useShort ? match.short_name : match.long_name
}

export function parseGooglePlace(place: google.maps.places.PlaceResult): ParsedAddress {
  const components = place.address_components ?? []
  const formatted = place.formatted_address?.trim() ?? ''

  const city =
    componentValue(components, 'locality') ||
    componentValue(components, 'administrative_area_level_2') ||
    componentValue(components, 'sublocality_level_1')

  const state = componentValue(components, 'administrative_area_level_1')
  const country = componentValue(components, 'country')
  const pincode = componentValue(components, 'postal_code')

  let latitude: number | null = null
  let longitude: number | null = null
  const loc = place.geometry?.location
  if (loc) {
    latitude = loc.lat()
    longitude = loc.lng()
  }

  return {
    full_address: formatted,
    addressLine1: formatted,
    city,
    state,
    country,
    pincode,
    latitude,
    longitude,
  }
}
