'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { MapPin } from 'lucide-react'

// Location data with cities and countries
const LOCATIONS = [
  // Switzerland - Cities
  { value: 'Zurich, Switzerland', label: 'Zurich', country: 'Switzerland', type: 'city' },
  { value: 'Geneva, Switzerland', label: 'Geneva', country: 'Switzerland', type: 'city' },
  { value: 'Basel, Switzerland', label: 'Basel', country: 'Switzerland', type: 'city' },
  { value: 'Bern, Switzerland', label: 'Bern', country: 'Switzerland', type: 'city' },
  { value: 'Lausanne, Switzerland', label: 'Lausanne', country: 'Switzerland', type: 'city' },
  { value: 'Lucerne, Switzerland', label: 'Lucerne', country: 'Switzerland', type: 'city' },
  { value: 'St. Gallen, Switzerland', label: 'St. Gallen', country: 'Switzerland', type: 'city' },
  { value: 'Lugano, Switzerland', label: 'Lugano', country: 'Switzerland', type: 'city' },
  { value: 'Winterthur, Switzerland', label: 'Winterthur', country: 'Switzerland', type: 'city' },
  { value: 'Zug, Switzerland', label: 'Zug', country: 'Switzerland', type: 'city' },
  // Switzerland - Country
  { value: 'Switzerland', label: 'Switzerland', country: 'Switzerland', type: 'country' },

  // Germany
  { value: 'Berlin, Germany', label: 'Berlin', country: 'Germany', type: 'city' },
  { value: 'Munich, Germany', label: 'Munich', country: 'Germany', type: 'city' },
  { value: 'Frankfurt, Germany', label: 'Frankfurt', country: 'Germany', type: 'city' },
  { value: 'Hamburg, Germany', label: 'Hamburg', country: 'Germany', type: 'city' },
  { value: 'Cologne, Germany', label: 'Cologne', country: 'Germany', type: 'city' },
  { value: 'Stuttgart, Germany', label: 'Stuttgart', country: 'Germany', type: 'city' },
  { value: 'Düsseldorf, Germany', label: 'Düsseldorf', country: 'Germany', type: 'city' },
  { value: 'Germany', label: 'Germany', country: 'Germany', type: 'country' },

  // France
  { value: 'Paris, France', label: 'Paris', country: 'France', type: 'city' },
  { value: 'Lyon, France', label: 'Lyon', country: 'France', type: 'city' },
  { value: 'Marseille, France', label: 'Marseille', country: 'France', type: 'city' },
  { value: 'Toulouse, France', label: 'Toulouse', country: 'France', type: 'city' },
  { value: 'Nice, France', label: 'Nice', country: 'France', type: 'city' },
  { value: 'Bordeaux, France', label: 'Bordeaux', country: 'France', type: 'city' },
  { value: 'France', label: 'France', country: 'France', type: 'country' },

  // UK
  { value: 'London, UK', label: 'London', country: 'United Kingdom', type: 'city' },
  { value: 'Manchester, UK', label: 'Manchester', country: 'United Kingdom', type: 'city' },
  { value: 'Birmingham, UK', label: 'Birmingham', country: 'United Kingdom', type: 'city' },
  { value: 'Edinburgh, UK', label: 'Edinburgh', country: 'United Kingdom', type: 'city' },
  { value: 'Bristol, UK', label: 'Bristol', country: 'United Kingdom', type: 'city' },
  { value: 'Cambridge, UK', label: 'Cambridge', country: 'United Kingdom', type: 'city' },
  { value: 'United Kingdom', label: 'United Kingdom', country: 'United Kingdom', type: 'country' },

  // Netherlands
  { value: 'Amsterdam, Netherlands', label: 'Amsterdam', country: 'Netherlands', type: 'city' },
  { value: 'Rotterdam, Netherlands', label: 'Rotterdam', country: 'Netherlands', type: 'city' },
  { value: 'The Hague, Netherlands', label: 'The Hague', country: 'Netherlands', type: 'city' },
  { value: 'Utrecht, Netherlands', label: 'Utrecht', country: 'Netherlands', type: 'city' },
  { value: 'Eindhoven, Netherlands', label: 'Eindhoven', country: 'Netherlands', type: 'city' },
  { value: 'Netherlands', label: 'Netherlands', country: 'Netherlands', type: 'country' },

  // Belgium
  { value: 'Brussels, Belgium', label: 'Brussels', country: 'Belgium', type: 'city' },
  { value: 'Antwerp, Belgium', label: 'Antwerp', country: 'Belgium', type: 'city' },
  { value: 'Ghent, Belgium', label: 'Ghent', country: 'Belgium', type: 'city' },
  { value: 'Belgium', label: 'Belgium', country: 'Belgium', type: 'country' },

  // Austria
  { value: 'Vienna, Austria', label: 'Vienna', country: 'Austria', type: 'city' },
  { value: 'Salzburg, Austria', label: 'Salzburg', country: 'Austria', type: 'city' },
  { value: 'Innsbruck, Austria', label: 'Innsbruck', country: 'Austria', type: 'city' },
  { value: 'Austria', label: 'Austria', country: 'Austria', type: 'country' },

  // Italy
  { value: 'Milan, Italy', label: 'Milan', country: 'Italy', type: 'city' },
  { value: 'Rome, Italy', label: 'Rome', country: 'Italy', type: 'city' },
  { value: 'Turin, Italy', label: 'Turin', country: 'Italy', type: 'city' },
  { value: 'Florence, Italy', label: 'Florence', country: 'Italy', type: 'city' },
  { value: 'Bologna, Italy', label: 'Bologna', country: 'Italy', type: 'city' },
  { value: 'Italy', label: 'Italy', country: 'Italy', type: 'country' },

  // Spain
  { value: 'Madrid, Spain', label: 'Madrid', country: 'Spain', type: 'city' },
  { value: 'Barcelona, Spain', label: 'Barcelona', country: 'Spain', type: 'city' },
  { value: 'Valencia, Spain', label: 'Valencia', country: 'Spain', type: 'city' },
  { value: 'Seville, Spain', label: 'Seville', country: 'Spain', type: 'city' },
  { value: 'Spain', label: 'Spain', country: 'Spain', type: 'country' },

  // Portugal
  { value: 'Lisbon, Portugal', label: 'Lisbon', country: 'Portugal', type: 'city' },
  { value: 'Porto, Portugal', label: 'Porto', country: 'Portugal', type: 'city' },
  { value: 'Portugal', label: 'Portugal', country: 'Portugal', type: 'country' },

  // Ireland
  { value: 'Dublin, Ireland', label: 'Dublin', country: 'Ireland', type: 'city' },
  { value: 'Cork, Ireland', label: 'Cork', country: 'Ireland', type: 'city' },
  { value: 'Ireland', label: 'Ireland', country: 'Ireland', type: 'country' },

  // Nordic
  { value: 'Stockholm, Sweden', label: 'Stockholm', country: 'Sweden', type: 'city' },
  { value: 'Sweden', label: 'Sweden', country: 'Sweden', type: 'country' },
  { value: 'Copenhagen, Denmark', label: 'Copenhagen', country: 'Denmark', type: 'city' },
  { value: 'Denmark', label: 'Denmark', country: 'Denmark', type: 'country' },
  { value: 'Oslo, Norway', label: 'Oslo', country: 'Norway', type: 'city' },
  { value: 'Norway', label: 'Norway', country: 'Norway', type: 'country' },
  { value: 'Helsinki, Finland', label: 'Helsinki', country: 'Finland', type: 'city' },
  { value: 'Finland', label: 'Finland', country: 'Finland', type: 'country' },

  // Other European
  { value: 'Prague, Czech Republic', label: 'Prague', country: 'Czech Republic', type: 'city' },
  { value: 'Czech Republic', label: 'Czech Republic', country: 'Czech Republic', type: 'country' },
  { value: 'Warsaw, Poland', label: 'Warsaw', country: 'Poland', type: 'city' },
  { value: 'Krakow, Poland', label: 'Krakow', country: 'Poland', type: 'city' },
  { value: 'Poland', label: 'Poland', country: 'Poland', type: 'country' },
  { value: 'Luxembourg', label: 'Luxembourg', country: 'Luxembourg', type: 'country' },

  // North America
  { value: 'New York, USA', label: 'New York', country: 'USA', type: 'city' },
  { value: 'San Francisco, USA', label: 'San Francisco', country: 'USA', type: 'city' },
  { value: 'Los Angeles, USA', label: 'Los Angeles', country: 'USA', type: 'city' },
  { value: 'Seattle, USA', label: 'Seattle', country: 'USA', type: 'city' },
  { value: 'Austin, USA', label: 'Austin', country: 'USA', type: 'city' },
  { value: 'Boston, USA', label: 'Boston', country: 'USA', type: 'city' },
  { value: 'Chicago, USA', label: 'Chicago', country: 'USA', type: 'city' },
  { value: 'USA', label: 'USA', country: 'USA', type: 'country' },
  { value: 'Toronto, Canada', label: 'Toronto', country: 'Canada', type: 'city' },
  { value: 'Vancouver, Canada', label: 'Vancouver', country: 'Canada', type: 'city' },
  { value: 'Montreal, Canada', label: 'Montreal', country: 'Canada', type: 'city' },
  { value: 'Canada', label: 'Canada', country: 'Canada', type: 'country' },

  // Asia Pacific
  { value: 'Singapore', label: 'Singapore', country: 'Singapore', type: 'country' },
  { value: 'Tokyo, Japan', label: 'Tokyo', country: 'Japan', type: 'city' },
  { value: 'Japan', label: 'Japan', country: 'Japan', type: 'country' },
  { value: 'Sydney, Australia', label: 'Sydney', country: 'Australia', type: 'city' },
  { value: 'Melbourne, Australia', label: 'Melbourne', country: 'Australia', type: 'city' },
  { value: 'Australia', label: 'Australia', country: 'Australia', type: 'country' },

  // Remote
  { value: 'Remote', label: 'Remote / Worldwide', country: '', type: 'remote' },
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
  placeholder = 'e.g., Switzerland, Geneva, Zurich',
  icon,
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [filteredLocations, setFilteredLocations] = useState(LOCATIONS)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  // Filter locations based on input
  useEffect(() => {
    if (!inputValue.trim()) {
      // Show popular locations when empty
      setFilteredLocations(LOCATIONS.filter(l =>
        l.country === 'Switzerland' || l.type === 'country' || l.type === 'remote'
      ).slice(0, 15))
      return
    }

    const search = inputValue.toLowerCase()
    const filtered = LOCATIONS.filter(location => {
      return (
        location.label.toLowerCase().includes(search) ||
        location.country.toLowerCase().includes(search) ||
        location.value.toLowerCase().includes(search)
      )
    }).slice(0, 10)

    setFilteredLocations(filtered)
  }, [inputValue])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
    setIsOpen(true)
  }

  const handleSelect = (location: typeof LOCATIONS[0]) => {
    setInputValue(location.value)
    onChange(location.value)
    setIsOpen(false)
  }

  const handleFocus = () => {
    setIsOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
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
            ${icon ? 'pl-10 pr-4' : 'px-4'}
          `}
        />
      </div>

      {/* Dropdown */}
      {isOpen && filteredLocations.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {filteredLocations.map((location, index) => (
            <button
              key={location.value + index}
              type="button"
              onClick={() => handleSelect(location)}
              className="w-full px-4 py-2.5 text-left hover:bg-primary/10 transition-colors flex items-center gap-3 border-b border-border/50 last:border-0"
            >
              <MapPin className={`w-4 h-4 flex-shrink-0 ${
                location.type === 'country' ? 'text-blue-400' :
                location.type === 'remote' ? 'text-green-400' :
                'text-muted'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {location.label}
                </p>
                {location.type === 'city' && (
                  <p className="text-xs text-muted">{location.country}</p>
                )}
                {location.type === 'country' && (
                  <p className="text-xs text-blue-400">Country</p>
                )}
                {location.type === 'remote' && (
                  <p className="text-xs text-green-400">Work from anywhere</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
