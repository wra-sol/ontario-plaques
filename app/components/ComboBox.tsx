import { useState, useRef, useEffect } from 'react';

interface ComboBoxProps {
  id: string;
  name: string;
  label?: string;
  value?: string;
  options: string[];
  placeholder?: string;
  emptyLabel?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}

// Normalize text: lowercase, remove accents, trim
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim();
}

// Score how well an option matches the search query
function scoreMatch(option: string, search: string): number {
  const normalizedOption = normalizeText(option);
  const normalizedSearch = normalizeText(search);
  
  // Exact match (case-insensitive, accent-insensitive)
  if (normalizedOption === normalizedSearch) return 1000;
  
  // Starts with search term
  if (normalizedOption.startsWith(normalizedSearch)) return 900;
  
  // Contains exact search term
  if (normalizedOption.includes(normalizedSearch)) return 800;
  
  // Split search into words and check if all words match
  const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 0);
  const optionWords = normalizedOption.split(/\s+/);
  
  // All search words present in option
  const allWordsMatch = searchWords.every(searchWord =>
    optionWords.some(optionWord => optionWord.includes(searchWord))
  );
  if (allWordsMatch) return 700;
  
  // Any word starts with search word
  const anyWordStarts = searchWords.some(searchWord =>
    optionWords.some(optionWord => optionWord.startsWith(searchWord))
  );
  if (anyWordStarts) return 600;
  
  // Fuzzy match: check if all characters in search appear in order in option
  let searchIndex = 0;
  for (let i = 0; i < normalizedOption.length && searchIndex < normalizedSearch.length; i++) {
    if (normalizedOption[i] === normalizedSearch[searchIndex]) {
      searchIndex++;
    }
  }
  if (searchIndex === normalizedSearch.length) {
    // All characters matched in order - score based on how dense the match is
    return 500 - (normalizedOption.length - normalizedSearch.length);
  }
  
  // Partial fuzzy: at least 70% of characters match in order
  const matchRatio = searchIndex / normalizedSearch.length;
  if (matchRatio >= 0.7) {
    return Math.floor(300 * matchRatio);
  }
  
  return 0; // No match
}

export function ComboBox({ 
  id, 
  name, 
  label, 
  value = '', 
  options, 
  placeholder = 'Search...',
  emptyLabel = 'All',
  onChange,
  style 
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedValue, setSelectedValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  
  const filteredOptions = search 
    ? options
        .map(opt => ({ option: opt, score: scoreMatch(opt, search) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ option }) => option)
    : options;
    
  const displayValue = selectedValue || emptyLabel;
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  const handleSelect = (option: string) => {
    // Update the hidden input synchronously before calling onChange
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = option;
    }
    setSelectedValue(option);
    setIsOpen(false);
    setSearch('');
    // Use setTimeout to ensure the DOM has been updated
    setTimeout(() => {
      onChange?.(option);
    }, 0);
  };
  
  const handleClear = () => {
    // Update the hidden input synchronously before calling onChange
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = '';
    }
    setSelectedValue('');
    setIsOpen(false);
    setSearch('');
    // Use setTimeout to ensure the DOM has been updated
    setTimeout(() => {
      onChange?.('');
    }, 0);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      {label && (
        <label htmlFor={id} style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
          {label}
        </label>
      )}
      
      {/* Hidden input for form submission */}
      <input ref={hiddenInputRef} type="hidden" name={name} value={selectedValue} />
      
      {/* Trigger button */}
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className="input"
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left',
          cursor: 'pointer',
          background: 'var(--white)',
        }}
      >
        <span style={{ 
          color: selectedValue ? 'var(--dark)' : 'var(--mid)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: 'monospace, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        }}>
          {displayValue}
        </span>
        <span style={{ marginLeft: '8px', flexShrink: 0, color: 'var(--dark)' }}>▼</span>
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'var(--white)',
          border: '2px solid var(--dark)',
          zIndex: 1000,
          maxHeight: '300px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Search input */}
          <div style={{ padding: '8px', borderBottom: '1px solid var(--mid)' }}>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="input"
              style={{ 
                width: '100%',
                fontSize: '13px',
                padding: '6px 8px',
                border: '2px solid var(--dark)',
                background: 'var(--white)',
                color: 'var(--dark)',
                fontFamily: 'monospace, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
              }}
            />
          </div>
          
          {/* Options list */}
          <div style={{ 
            overflowY: 'auto',
            maxHeight: '240px'
          }}>
            {/* Clear/All option */}
            <button
              type="button"
              onClick={handleClear}
              style={{
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                border: 'none',
                background: !selectedValue ? 'var(--light)' : 'transparent',
                color: 'var(--dark)',
                cursor: 'pointer',
                fontWeight: !selectedValue ? 600 : 400,
                fontSize: '13px'
              }}
              onMouseEnter={(e) => {
                if (selectedValue) e.currentTarget.style.background = 'var(--light)';
              }}
              onMouseLeave={(e) => {
                if (selectedValue) e.currentTarget.style.background = 'transparent';
              }}
            >
              {emptyLabel}
            </button>
            
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    border: 'none',
                    background: selectedValue === option ? 'var(--light)' : 'transparent',
                    color: 'var(--dark)',
                    cursor: 'pointer',
                    fontWeight: selectedValue === option ? 600 : 400,
                    fontSize: '13px'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedValue !== option) e.currentTarget.style.background = 'var(--light)';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedValue !== option) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {option}
                </button>
              ))
            ) : (
              <div style={{ 
                padding: '12px', 
                textAlign: 'center', 
                color: 'var(--mid)',
                fontSize: '13px'
              }}>
                No matches found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

