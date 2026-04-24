import { useEffect, useId, useRef, useState } from 'react'
import './SearchableSelect.css'

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function SearchableSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  emptyMessage = 'No hay resultados para mostrar.',
  disabled = false,
  required = false,
  variant = 'boxed',
}) {
  const listId = useId()
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const selectedOption = options.find((option) => option.value === value) ?? null
  const [query, setQuery] = useState(selectedOption?.label ?? '')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setQuery(selectedOption?.label ?? '')
  }, [selectedOption?.label])

  useEffect(() => {
    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false)
        setQuery(selectedOption?.label ?? '')
      }
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [selectedOption?.label])

  useEffect(() => {
    if (!inputRef.current) return

    inputRef.current.setCustomValidity(required && !value ? 'Selecciona una opcion de la lista.' : '')
  }, [required, value])

  const filteredOptions = options.filter((option) => {
    if (!query.trim()) return true

    const haystack = `${normalizeText(option.label)} ${normalizeText(option.description)}`
    return haystack.includes(normalizeText(query))
  })

  function handleInputChange(event) {
    const nextValue = event.target.value
    setQuery(nextValue)
    setIsOpen(true)

    if (value !== '') {
      onChange('')
    }
  }

  function handleOptionSelect(option) {
    onChange(option.value)
    setQuery(option.label)
    setIsOpen(false)
  }

  return (
    <div
      className={`searchable-select searchable-select--${variant} ${disabled ? 'is-disabled' : ''} ${query.trim() || value ? 'has-value' : ''}`}
      ref={containerRef}
    >
      {label ? <span className="searchable-select-label">{label}</span> : null}

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={variant === 'line' ? ' ' : placeholder}
        className="searchable-select-input"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        disabled={disabled}
        required={required && !value}
      />

      <input type="hidden" value={value} readOnly />

      {isOpen ? (
        <div className="searchable-select-menu" id={listId} role="listbox">
          {filteredOptions.length === 0 ? (
            <div className="searchable-select-empty">{emptyMessage}</div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`searchable-select-option ${option.value === value ? 'is-selected' : ''}`}
                style={{ background: undefined }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleOptionSelect(option)}
                role="option"
                aria-selected={option.value === value}
              >
                <strong>{option.label}</strong>
                {option.description ? <span>{option.description}</span> : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

export default SearchableSelect
