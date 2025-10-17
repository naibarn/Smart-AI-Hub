import React, { useState, useEffect, useRef } from 'react';
import { Input, AutoComplete, Button, Space, Tooltip } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';

const { Search } = Input;

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  loading?: boolean;
  allowClear?: boolean;
  size?: 'small' | 'middle' | 'large';
  style?: React.CSSProperties;
  debounceMs?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search agents...',
  suggestions = [],
  loading = false,
  allowClear = true,
  size = 'middle',
  style,
  debounceMs = 300,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [searchOptions, setSearchOptions] = useState<{ value: string; label: string }[]>([]);
  const debouncedSearchRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<any>(null);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Update search options when suggestions change
  useEffect(() => {
    const options = suggestions.map(suggestion => ({
      value: suggestion,
      label: suggestion,
    }));
    setSearchOptions(options);
  }, [suggestions]);

  // Debounced search
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    
    if (onChange) {
      onChange(newValue);
    }

    // Clear existing timeout
    if (debouncedSearchRef.current) {
      clearTimeout(debouncedSearchRef.current);
    }

    // Set new timeout for debounced search
    if (onSearch) {
      debouncedSearchRef.current = setTimeout(() => {
        onSearch(newValue);
      }, debounceMs);
    }
  };

  const handleSearch = (searchValue: string) => {
    if (onSearch) {
      onSearch(searchValue);
    }
  };

  const handleClear = () => {
    setInputValue('');
    if (onChange) {
      onChange('');
    }
    if (onSearch) {
      onSearch('');
    }
    inputRef.current?.focus();
  };

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    if (onChange) {
      onChange(selectedValue);
    }
    if (onSearch) {
      onSearch(selectedValue);
    }
  };

  const renderInput = () => {
    if (searchOptions.length > 0) {
      return (
        <AutoComplete
          ref={inputRef}
          value={inputValue}
          options={searchOptions}
          onSelect={handleSelect}
          onChange={handleInputChange}
          style={{ width: '100%', ...style }}
          size={size}
          notFoundContent={loading ? 'Searching...' : 'No suggestions'}
          allowClear={false} // We handle clear ourselves
          filterOption={(inputValue, option) =>
            option!.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
          }
        >
          <Search
            placeholder={placeholder}
            enterButton={
              <Button 
                type="primary" 
                icon={<SearchOutlined />}
                loading={loading}
                size={size}
              >
                Search
              </Button>
            }
            size={size}
            loading={loading}
            onSearch={handleSearch}
            suffix={
              inputValue && allowClear ? (
                <Tooltip title="Clear search">
                  <Button
                    type="text"
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={handleClear}
                    style={{ border: 'none', boxShadow: 'none' }}
                  />
                </Tooltip>
              ) : null
            }
          />
        </AutoComplete>
      );
    }

    return (
      <Search
        ref={inputRef}
        value={inputValue}
        placeholder={placeholder}
        enterButton={
          <Button 
            type="primary" 
            icon={<SearchOutlined />}
            loading={loading}
            size={size}
          >
            Search
          </Button>
        }
        size={size}
        loading={loading}
        onChange={(e) => handleInputChange(e.target.value)}
        onSearch={handleSearch}
        allowClear={allowClear}
        onClear={handleClear}
        style={style}
      />
    );
  };

  return (
    <div className="search-bar">
      {renderInput()}
    </div>
  );
};

export default SearchBar;