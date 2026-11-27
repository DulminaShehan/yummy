import React, { useState } from 'react';
import { MapPin, Search, X, Check } from 'lucide-react';

interface LocationModalProps {
  currentCity: string;
  onSelect: (city: string) => void;
  onClose: () => void;
}

const POPULAR_GLOBAL_CITIES = [
  'New York, USA',
  'London, UK',
  'Dubai, UAE',
  'Toronto, Canada',
  'Sydney, Australia',
  'Singapore',
  'Paris, France',
  'Tokyo, Japan',
  'Colombo, Sri Lanka',
  'Mumbai, India',
];

export const LocationModal: React.FC<LocationModalProps> = ({
  currentCity,
  onSelect,
  onClose,
}) => {
  const [inputVal, setInputVal] = useState(currentCity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSelect(inputVal.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Choose Delivery Location
              </h3>
              <p className="text-xs text-slate-500">
                Discover restaurants delivering to your area
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Enter city, street or postal address..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-20 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-sm text-slate-800 outline-none transition"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold transition"
              >
                Set
              </button>
            </div>
          </form>

          {/* Popular Cities */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Popular Cities
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_GLOBAL_CITIES.map((city) => {
                const isSelected = city.toLowerCase() === currentCity.toLowerCase();
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => onSelect(city)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      isSelected
                        ? 'bg-blue-700 text-white font-semibold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{city}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
