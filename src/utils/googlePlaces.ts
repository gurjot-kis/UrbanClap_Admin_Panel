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
let placesLibraryLoaded = false

export function getGoogleMapsApiKey(): string {
  return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() ?? ''
}

function waitForMapsBootstrap(): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 15000
    const wait = () => {
      if (window.google?.maps) {
        resolve()
      } else if (Date.now() > deadline) {
        reject(new Error('Timed out loading Google Maps'))
      } else {
        setTimeout(wait, 50)
      }
    }
    wait()
  })
}

function injectMapsBootstrap(apiKey: string): Promise<void> {
  if (window.google?.maps) {
    return Promise.resolve()
  }

  const existing = document.querySelector('script[data-google-maps-bootstrap]')
  if (existing) {
    return waitForMapsBootstrap()
  }

  return new Promise((resolve, reject) => {
    const config = JSON.stringify({ key: apiKey, v: 'weekly' })
    const script = document.createElement('script')
    script.dataset.googleMapsBootstrap = 'true'
    script.textContent = `(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=\`https://maps.\${c}apis.com/maps/api/js?\`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})(${config});`
    script.onerror = () => reject(new Error('Failed to load Google Maps bootstrap'))
    document.head.appendChild(script)

    waitForMapsBootstrap().then(resolve).catch(reject)
  })
}

export async function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (!apiKey) {
    throw new Error('Google Maps API key is not configured (VITE_GOOGLE_MAPS_API_KEY)')
  }

  if (placesLibraryLoaded) return
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    await injectMapsBootstrap(apiKey)
    await window.google!.maps!.importLibrary('places')
    placesLibraryLoaded = true
  })()

  return loadPromise
}

function componentValue(
  components: google.maps.places.AddressComponent[] | undefined,
  type: string,
  useShort = false
): string {
  const match = components?.find((c) => c.types.includes(type))
  if (!match) return ''
  return useShort ? (match.shortText ?? '') : (match.longText ?? '')
}

export function parseGooglePlace(place: google.maps.places.Place): ParsedAddress {
  const components = place.addressComponents ?? []
  const formatted = place.formattedAddress?.trim() ?? ''

  const city =
    componentValue(components, 'locality') ||
    componentValue(components, 'administrative_area_level_2') ||
    componentValue(components, 'sublocality_level_1')

  const state = componentValue(components, 'administrative_area_level_1')
  const country = componentValue(components, 'country')
  const pincode = componentValue(components, 'postal_code')

  let latitude: number | null = null
  let longitude: number | null = null
  const loc = place.location
  if (loc) {
    latitude = loc.lat()
    longitude = loc.lng()
  }

  const streetNumber = componentValue(components, 'street_number')
  const route = componentValue(components, 'route')
  const addressLine1 =
    [streetNumber, route].filter(Boolean).join(' ').trim() || formatted

  return {
    full_address: formatted,
    addressLine1,
    city,
    state,
    country,
    pincode,
    latitude,
    longitude,
  }
}
