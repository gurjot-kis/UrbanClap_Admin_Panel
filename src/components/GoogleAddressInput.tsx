import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import {
  getGoogleMapsApiKey,
  loadGoogleMapsScript,
  parseGooglePlace,
  type ParsedAddress,
} from '../utils/googlePlaces'

interface Props {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (parsed: ParsedAddress) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

function GoogleAddressInput({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Search address with Google…',
  disabled = false,
  className = 'form-control edit-modal-input',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const elementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null)
  const onChangeRef = useRef(onChange) as MutableRefObject<typeof onChange>
  const onPlaceSelectRef = useRef(onPlaceSelect) as MutableRefObject<typeof onPlaceSelect>
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  onChangeRef.current = onChange
  onPlaceSelectRef.current = onPlaceSelect

  useEffect(() => {
    const apiKey = getGoogleMapsApiKey()
    if (!apiKey) {
      setLoadError('Set VITE_GOOGLE_MAPS_API_KEY in .env for address suggestions')
      return
    }

    let cancelled = false
    let autocompleteEl: google.maps.places.PlaceAutocompleteElement | null = null

    const handleInput = () => {
      if (autocompleteEl) onChangeRef.current(autocompleteEl.value)
    }

    const handleSelect = async (event: google.maps.places.PlacePredictionSelectEvent) => {
      const place = event.placePrediction.toPlace()
      await place.fetchFields({
        fields: ['formattedAddress', 'addressComponents', 'location'],
      })
      const parsed = parseGooglePlace(place)
      onChangeRef.current(parsed.full_address)
      onPlaceSelectRef.current(parsed)
    }

    loadGoogleMapsScript(apiKey)
      .then(async () => {
        if (cancelled || !containerRef.current) return

        const { PlaceAutocompleteElement } = (await window.google!.maps!.importLibrary(
          'places'
        )) as google.maps.places.PlacesLibrary

        autocompleteEl = new PlaceAutocompleteElement({
          includedRegionCodes: ['in'],
        })
        autocompleteEl.placeholder = placeholder
        autocompleteEl.disabled = disabled
        autocompleteEl.className = className
        autocompleteEl.style.width = '100%'
        if (value) autocompleteEl.value = value

        autocompleteEl.addEventListener('gmp-select', handleSelect)
        autocompleteEl.addEventListener('input', handleInput)

        containerRef.current.innerHTML = ''
        containerRef.current.appendChild(autocompleteEl)
        elementRef.current = autocompleteEl
        setReady(true)
        setLoadError(null)
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Could not load Google Places')
        }
      })

    return () => {
      cancelled = true
      if (autocompleteEl) {
        autocompleteEl.removeEventListener('gmp-select', handleSelect)
        autocompleteEl.removeEventListener('input', handleInput)
        autocompleteEl.remove()
      }
      elementRef.current = null
    }
  }, [])

  useEffect(() => {
    const el = elementRef.current
    if (!el || !ready) return
    el.placeholder = placeholder
    el.disabled = disabled
    if (el.value !== value) el.value = value
  }, [value, placeholder, disabled, ready])

  return (
    <div>
      <div ref={containerRef} className="google-address-autocomplete" />
      {loadError && (
        <small className="text-warning d-block mt-1">{loadError}</small>
      )}
      {ready && !loadError && (
        <small className="text-muted d-block mt-1">Start typing for Google address suggestions</small>
      )}
    </div>
  )
}

export default GoogleAddressInput
