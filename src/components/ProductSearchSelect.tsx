import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Package } from 'lucide-react';
import { InventoryItem } from '../context/AppDataContext';

interface ProductSearchSelectProps {
  inventory: InventoryItem[];
  value: string;
  onChange: (selectedItem: InventoryItem | null) => void;
  placeholder?: string;
  required?: boolean;
}

export default function ProductSearchSelect({
  inventory,
  value,
  onChange,
  placeholder = 'ابحث عن صنف بالاسم أو الكود...',
  required = false
}: ProductSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedItem = inventory.find(i => i.id === value);

  // Sync input text with selected item name when not actively searching
  useEffect(() => {
    if (selectedItem) {
      setSearchTerm(selectedItem.name);
    } else if (!value) {
      setSearchTerm('');
    }
  }, [value, selectedItem]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search term to selected item name if closed
        if (selectedItem) {
          setSearchTerm(selectedItem.name);
        } else if (!value) {
          setSearchTerm('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedItem, value]);

  const filteredItems = useMemo(() => {
    if (!searchTerm || (selectedItem && searchTerm === selectedItem.name)) return inventory;
    const term = searchTerm.toLowerCase().trim();
    return inventory.filter(item => {
      return (
        (item.name && item.name.toLowerCase().includes(term)) ||
        (item.code && item.code.toLowerCase().includes(term)) ||
        (item.brand && item.brand.toLowerCase().includes(term)) ||
        (item.compatibleCars && item.compatibleCars.toLowerCase().includes(term))
      );
    });
  }, [inventory, searchTerm, selectedItem]);

  const handleSelect = (item: InventoryItem) => {
    onChange(item);
    setSearchTerm(item.name);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div 
        className={`relative flex items-center border rounded-lg bg-white transition-all ${
          isOpen 
            ? 'border-[#10B981] ring-2 ring-[#10B981]/20 shadow-sm' 
            : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
        }`}
      >
        <Search className="w-4 h-4 text-[#94A3B8] absolute right-3 pointer-events-none" />
        
        <input
          type="text"
          value={searchTerm}
          required={required && !value}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            if (value && e.target.value !== selectedItem?.name) {
              onChange(null);
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pr-9 pl-16 py-2 text-sm text-[#1E293B] placeholder-[#94A3B8] bg-transparent focus:outline-none rounded-lg"
        />

        <div className="absolute left-2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-[#F1F5F9] rounded-full text-[#94A3B8] hover:text-[#DC2626] transition-colors cursor-pointer"
              title="مسح الاختيار"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-[#F1F5F9] rounded-full text-[#94A3B8] transition-colors cursor-pointer"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-[#F1F5F9] transition-all dir-rtl">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const isSelected = item.id === value;
              return (
                <div
                  key={item.id ? `product-search-${item.id}` : `product-search-idx-${idx}`}
                  onClick={() => handleSelect(item)}
                  className={`p-2.5 flex items-center justify-between cursor-pointer hover:bg-[#F0FDF4] transition-colors ${
                    isSelected ? 'bg-[#ECFDF5]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center shrink-0 text-[#64748B]">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#1E293B] truncate">{item.name}</span>
                        {item.code && (
                          <span className="text-[10px] font-mono bg-[#E2E8F0] text-[#475569] px-1.5 py-0.5 rounded">
                            {item.code}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#64748B] flex items-center gap-3 mt-0.5">
                        {item.brand && <span>الماركة: {item.brand}</span>}
                        <span>متوفر بالمخزن: <strong className={item.quantity > 0 ? 'text-[#059669]' : 'text-[#DC2626]'}>{item.quantity}</strong></span>
                        {item.purchasePrice > 0 && <span>آخر تكلفة: {Number(item.purchasePrice || 0).toLocaleString()} ج.م</span>}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mr-2" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-sm text-[#64748B]">
              لا يوجد صنف مطابق لـ "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
