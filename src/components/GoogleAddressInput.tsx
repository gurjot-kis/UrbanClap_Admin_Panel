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
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
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

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (cancelled || !inputRef.current || !window.google?.maps?.places) return

        const Autocomplete = window.google.maps.places.Autocomplete
        const ac = new Autocomplete(inputRef.current, { types: ['address'] })

        ac.addListener('place_changed', () => {
          const place = ac.getPlace()
          const parsed = parseGooglePlace(place)
          onChangeRef.current(parsed.full_address)
          onPlaceSelectRef.current(parsed)
        })

        autocompleteRef.current = ac
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
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
      autocompleteRef.current = null
    }
  }, [])

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
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
