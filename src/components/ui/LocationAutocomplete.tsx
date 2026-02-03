'use client'

import { useState, useRef, useEffect, ReactNode, useCallback } from 'react'
import { MapPin, Loader2, Globe } from 'lucide-react'

interface NominatimResult {
  place_id: number
  display_name: string
  type: string
  class: string
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    state?: string
    country?: string
    country_code?: string
  }
}

interface LocationSuggestion {
  value: string
  label: string
  sublabel: string
  type: 'city' | 'country' | 'region'
}

// Popular locations shown by default
const POPULAR_LOCATIONS: LocationSuggestion[] = [
  { value: 'Switzerland', label: 'Switzerland', sublabel: 'Country', type: 'country' },
  { value: 'Zurich, Switzerland', label: 'Zurich', sublabel: 'Switzerland', type: 'city' },
  { value: 'Geneva, Switzerland', label: 'Geneva', sublabel: 'Switzerland', type: 'city' },
  { value: 'Basel, Switzerland', label: 'Basel', sublabel: 'Switzerland', type: 'city' },
  { value: 'Bern, Switzerland', label: 'Bern', sublabel: 'Switzerland', type: 'city' },
  { value: 'Lausanne, Switzerland', label: 'Lausanne', sublabel: 'Switzerland', type: 'city' },
  { value: 'France', label: 'France', sublabel: 'Country', type: 'country' },
  { value: 'Paris, France', label: 'Paris', sublabel: 'France', type: 'city' },
  { value: 'Germany', label: 'Germany', sublabel: 'Country', type: 'country' },
  { value: 'Berlin, Germany', label: 'Berlin', sublabel: 'Germany', type: 'city' },
  { value: 'Remote', label: 'Remote', sublabel: 'Work from anywhere', type: 'region' },
]

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  icon?: ReactNode
}

export default function LocationAutocomplete({
  value,
  onChange,
  label,
  placeholder = 'Search any city or country...',
  icon,
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>(POPULAR_LOCATIONS)
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Sync input value with prop
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch suggestions from Nominatim API
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions(POPULAR_LOCATIONS)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      // Use Nominatim API for geocoding (no featuretype filter to include all places)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=15`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      )

      if (!response.ok) throw new Error('API error')

      const results: NominatimResult[] = await response.json()

      const newSuggestions: LocationSuggestion[] = results
        .map((result) => {
          const address = result.address || {}
          const cityName = address.city || address.town || address.village || address.municipality
          const country = address.country || ''
          const state = address.state || address.county || ''

          // Determine type and labels
          if (result.class === 'boundary' && result.type === 'administrative' && !cityName) {
            // Country or region
            if (country && !state) {
              return {
                value: country,
                label: country,
                sublabel: 'Country',
                type: 'country' as const,
              }
            } else if (state && country) {
              return {
                value: `${state}, ${country}`,
                label: state,
                sublabel: country,
                type: 'region' as const,
              }
            }
          }

          // City/town
          if (cityName) {
            return {
              value: `${cityName}, ${country}`,
              label: cityName,
              sublabel: state ? `${state}, ${country}` : country,
              type: 'city' as const,
            }
          }

          // Fallback: use display name
          const parts = result.display_name.split(', ')
          return {
            value: parts.slice(0, 2).join(', '),
            label: parts[0],
            sublabel: parts.slice(1, 3).join(', '),
            type: 'city' as const,
          }
        })
        .filter((s, i, arr) =>
          // Remove duplicates
          arr.findIndex(x => x.value === s.value) === i
        )

      setSuggestions(newSuggestions.length > 0 ? newSuggestions : POPULAR_LOCATIONS)
    } catch (error) {
      console.error('Location search error:', error)
      // Fallback to filtering popular locations
      const filtered = POPULAR_LOCATIONS.filter(l =>
        l.label.toLowerCase().includes(query.toLowerCase()) ||
        l.sublabel.toLowerCase().includes(query.toLowerCase())
      )
      setSuggestions(filtered.length > 0 ? filtered : POPULAR_LOCATIONS)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!isOpen) return

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(inputValue)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [inputValue, isOpen, fetchSuggestions])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
    setIsOpen(true)
  }

  const handleSelect = (location: LocationSuggestion) => {
    setInputValue(location.value)
    onChange(location.value)
    setIsOpen(false)
  }

  const handleFocus = () => {
    setIsOpen(true)
    if (!inputValue) {
      setSuggestions(POPULAR_LOCATIONS)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'country':
        return <Globe className="w-4 h-4 text-blue-400" />
      case 'region':
        return <MapPin className="w-4 h-4 text-orange-400" />
      default:
        return <MapPin className="w-4 h-4 text-muted" />
    }
  }

  return (
    <div ref={wrapperRef} className="relative space-y-1">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            w-full py-2.5 bg-card border border-border rounded-lg
            text-foreground placeholder-muted
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            transition-all duration-200
            ${icon ? 'pl-10 pr-10' : 'px-4 pr-10'}
          `}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-muted animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {!inputValue && (
            <div className="px-3 py-2 text-xs text-muted border-b border-border">
              Popular locations
            </div>
          )}
          {suggestions.map((location, index) => (
            <button
              key={location.value + index}
              type="button"
              onClick={() => handleSelect(location)}
              className="w-full px-4 py-2.5 text-left hover:bg-primary/10 transition-colors flex items-center gap-3 border-b border-border/50 last:border-0"
            >
              {getIcon(location.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {location.label}
                </p>
                <p className="text-xs text-muted truncate">{location.sublabel}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
