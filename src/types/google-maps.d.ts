declare namespace google.maps.places {
  interface PlacePredictionSelectEvent extends Event {
    placePrediction: PlacePrediction
  }

  interface PlacePrediction {
    toPlace(): Place
  }

  interface Place {
    formattedAddress?: string
    addressComponents?: AddressComponent[]
    location?: google.maps.LatLng
    fetchFields(options: { fields: string[] }): Promise<void>
  }

  interface AddressComponent {
    longText?: string
    shortText?: string
    types: string[]
  }

  interface PlaceAutocompleteElementOptions {
    placeholder?: string
    includedRegionCodes?: string[]
  }

  class PlaceAutocompleteElement extends HTMLElement {
    constructor(options?: PlaceAutocompleteElementOptions)
    placeholder: string
    disabled: boolean
    value: string
    addEventListener(
      type: 'gmp-select',
      listener: (event: PlacePredictionSelectEvent) => void
    ): void
    addEventListener(type: 'input', listener: () => void): void
    removeEventListener(
      type: 'gmp-select',
      listener: (event: PlacePredictionSelectEvent) => void
    ): void
    removeEventListener(type: 'input', listener: () => void): void
  }

  interface PlacesLibrary {
    PlaceAutocompleteElement: typeof PlaceAutocompleteElement
  }
}

declare namespace google.maps {
  interface LatLng {
    lat(): number
    lng(): number
  }

  interface MapsLibrary {
    importLibrary(name: 'places'): Promise<google.maps.places.PlacesLibrary>
    importLibrary(name: string): Promise<unknown>
  }
}

interface Window {
  google?: {
    maps?: google.maps.MapsLibrary & {
      importLibrary(name: 'places'): Promise<google.maps.places.PlacesLibrary>
      importLibrary(name: string): Promise<unknown>
    }
  }
}
