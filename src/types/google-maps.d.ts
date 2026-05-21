declare namespace google.maps.places {
  interface PlaceResult {
    formatted_address?: string
    address_components?: Array<{
      long_name: string
      short_name: string
      types: string[]
    }>
    geometry?: {
      location?: {
        lat: () => number
        lng: () => number
      }
    }
  }

  class Autocomplete {
    constructor(
      inputField: HTMLInputElement,
      opts?: { types?: string[]; fields?: string[] }
    )
    addListener(event: string, handler: () => void): void
    getPlace(): PlaceResult
  }
}

interface Window {
  google?: {
    maps?: {
      places?: {
        Autocomplete: typeof google.maps.places.Autocomplete
      }
      event?: { clearInstanceListeners: (instance: unknown) => void }
    }
  }
}
