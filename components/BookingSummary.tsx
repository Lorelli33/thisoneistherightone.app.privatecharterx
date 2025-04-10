import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Plane, Calendar, Clock, Users, Briefcase, Dog, ArrowRight, RotateCcw, Mail, ArrowLeft, Coins, ChevronDown, MapPin } from 'lucide-react';
import type { Location, Stop, JetCategory, BookingDetails } from '../types';
import { calculateRequiredStops, calculateTotalFlightTime, calculateTotalPrice, calculatePVCXRewards } from '../data/jets';
import CheckoutForm from './CheckoutForm';

interface BookingSummaryProps {
  origin: Location;
  destination: Location;
  stops: Stop[];
  selectedDate: string;
  selectedTime: string;
  returnDate?: string;
  returnTime?: string;
  isReturn: boolean;
  bookingDetails: BookingDetails;
  selectedJet: JetCategory;
  onBack: () => void;
}

type Currency = {
  code: string;
  symbol: string;
  rate: number;
};

const currencies: Currency[] = [
  { code: 'EUR', symbol: '€', rate: 1 },
  { code: 'USD', symbol: '$', rate: 1.08 },
  { code: 'GBP', symbol: '£', rate: 0.85 },
  { code: 'CHF', symbol: 'CHF', rate: 0.95 }
];

const cryptoRates = {
  ETH: 3450.00,
  BTC: 62000.00
};

export default function BookingSummary({
  origin,
  destination,
  stops,
  selectedDate,
  selectedTime,
  returnDate,
  returnTime,
  isReturn,
  bookingDetails,
  selectedJet,
  onBack
}: BookingSummaryProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setShowCurrencyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatLocation = (location: Location) => {
    if (!location?.address) return { city: '', code: '' };
    const parts = location.address.split('(');
    return {
      city: parts[0].trim(),
      code: parts[1]?.replace(')', '') || ''
    };
  };

  const formatDateTime = (date: string, time: string) => {
    return format(new Date(`${date}T${time}`), 'MMM d, yyyy h:mm a');
  };

  const formatPrice = (price: number, currency: Currency = selectedCurrency): string => {
    const convertedPrice = price * currency.rate;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(convertedPrice);
  };

  const formatCryptoPrice = (priceInEur: number, rate: number): string => {
    return (priceInEur / rate).toFixed(rate < 1 ? 0 : 6);
  };

  const calculateTotalDistance = (): number => {
    if (!origin?.lat || !destination?.lat) return 0;

    const R = 6371; // Earth's radius in km
    const points = [origin, ...stops, destination];
    let totalDistance = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const point1 = points[i];
      const point2 = points[i + 1];
      
      if (!point1?.lat || !point2?.lat) continue;

      const dLat = (point2.lat - point1.lat) * Math.PI / 180;
      const dLon = (point2.lng - point1.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      totalDistance += R * c;
    }

    return Math.round(isReturn ? totalDistance * 2 : totalDistance);
  };

  const totalDistance = calculateTotalDistance();
  const requiredStops = calculateRequiredStops(totalDistance, selectedJet.range);
  const flightTime = calculateTotalFlightTime(totalDistance, selectedJet.speed, requiredStops);
  const totalPrice = calculateTotalPrice(totalDistance, selectedJet.speed, selectedJet.pricePerHour, requiredStops);
  const totalPVCX = calculatePVCXRewards(totalDistance);

  const handleCheckout = () => {
    setShowCheckout(true);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold">Booking Summary</h2>
            <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <span>{formatLocation(origin).city}</span>
              <ArrowRight size={14} className="text-gray-400" />
              <span>{formatLocation(destination).city}</span>
            </div>
          </div>
        </div>
      </div>

      {showCheckout ? (
        <CheckoutForm
          offerId={`custom-${Date.now()}`}
          offerType="fixed_offer"
          title={`${formatLocation(origin).city} to ${formatLocation(destination).city}`}
          price={totalPrice}
          currency={selectedCurrency.code}
          onClose={onBack}
          onSuccess={() => setShowCheckout(false)}
        />
      ) : (
        <>
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Route Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="text-xl font-bold">{formatLocation(origin).city}</div>
                    <div className="text-sm text-gray-500">{formatLocation(origin).code}</div>
                  </div>
                  <ArrowRight size={20} className="hidden md:block text-gray-400" />
                  <div className="flex-1 md:text-right">
                    <div className="text-xl font-bold">{formatLocation(destination).city}</div>
                    <div className="text-sm text-gray-500">{formatLocation(destination).code}</div>
                  </div>
                </div>

                {stops.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-medium text-gray-700">Stops</div>
                    {stops.map((stop, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <MapPin size={16} className="text-gray-400" />
                        <span>{formatLocation(stop).city}</span>
                        <span className="text-gray-400">•</span>
                        <span>{formatDateTime(stop.date, stop.time)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Departure</div>
                    <div className="font-medium">{formatDateTime(selectedDate, selectedTime)}</div>
                  </div>
                  {isReturn && returnDate && returnTime && (
                    <div>
                      <div className="text-gray-500">Return</div>
                      <div className="font-medium">{formatDateTime(returnDate, returnTime)}</div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">Total Distance</div>
                    <div className="font-medium">{totalDistance} km</div>
                  </div>
                </div>
              </div>

              {/* Aircraft & Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedJet.imageUrl}
                      alt={selectedJet.name}
                      className="w-20 h-20 object-contain"
                    />
                    <div>
                      <h4 className="font-bold">{selectedJet.name}</h4>
                      <div className="text-sm text-gray-500">{selectedJet.category}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{selectedJet.capacity} seats</span>
                        <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">{selectedJet.speed} km/h</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="space-y-4">
                    {/* Currency Selector */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">Total Price (Estimated)</div>
                      <div className="relative" ref={currencyDropdownRef}>
                        <button
                          onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                          className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <span className="font-medium">{selectedCurrency.code}</span>
                          <ChevronDown size={16} className={`transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showCurrencyDropdown && (
                          <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                            {currencies.map((currency) => (
                              <button
                                key={currency.code}
                                onClick={() => {
                                  setSelectedCurrency(currency);
                                  setShowCurrencyDropdown(false);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                              >
                                <span>{currency.code}</span>
                                {selectedCurrency.code === currency.code && (
                                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fiat Price */}
                    <div>
                      <div className="text-2xl font-bold">{formatPrice(totalPrice)}</div>
                      <div className="text-sm text-gray-500">
                        {formatPrice(selectedJet.pricePerHour)}/hour • {Math.round(flightTime * 10) / 10} hours
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Final price may vary based on additional services and specific requirements
                      </div>
                    </div>

                    {/* Crypto Prices */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <div className="text-sm font-medium text-gray-700">Crypto Equivalent</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-gray-500">ETH</div>
                          <div className="font-medium">{formatCryptoPrice(totalPrice, cryptoRates.ETH)} ETH</div>
                        </div>
                        <div>
                          <div className="text-gray-500">BTC</div>
                          <div className="font-medium">{formatCryptoPrice(totalPrice, cryptoRates.BTC)} BTC</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passenger Details */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Users size={16} />
                      <span>Passengers</span>
                    </div>
                    <div className="font-bold">{bookingDetails.passengers}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Briefcase size={16} />
                      <span>Luggage</span>
                    </div>
                    <div className="font-bold">{bookingDetails.luggage}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Dog size={16} />
                      <span>Pets</span>
                    </div>
                    <div className="font-bold">{bookingDetails.pets}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 bg-white border-t border-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
              <button
                onClick={handleCheckout}
                className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <span>Continue to Checkout</span>
                <ArrowRight size={18} />
              </button>
              <div className="text-center text-sm text-gray-500 mt-4">
                You'll have a chance to review your booking before payment
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}