import { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, ChevronDown } from 'lucide-react';
import './filters.css';

export default function SortDropdown({ sortPrice, setSortPrice }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const options = [
        { value: 'none', label: 'مقترح' },
        { value: 'asc', label: 'السعر: من الأقل للأعلى' },
        { value: 'desc', label: 'السعر: من الأعلى للأقل' }
    ];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(o => o.value === sortPrice)?.label || 'الترتيب';

    return (
        <div className="sort-container" ref={dropdownRef}>
            <button className="sort-trigger" onClick={() => setIsOpen(!isOpen)}>
                <ArrowUpDown size={18} />
                {selectedLabel}
                <ChevronDown size={16} />
            </button>
            
            {isOpen && (
                <div className="sort-menu">
                    {options.map(option => (
                        <button
                            key={option.value}
                            className={`sort-item ${sortPrice === option.value ? 'active' : ''}`}
                            onClick={() => {
                                setSortPrice(option.value);
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
