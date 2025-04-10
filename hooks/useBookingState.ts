import { useState, useEffect } from 'react';
import type { Location, Stop, BookingDetails } from '../types';

export function useBookingState() {
  // Load saved state from localStorage
  const loadSavedState = () => {
    try {
      const savedState = localStorage.getItem('bookingState');
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
    return null;
  };

  const savedState = loadSavedState();

  // Initialize state with saved values or defaults
  const [origin, setOrigin] = useState<Location | null>(savedState?.origin || null);
  const [destination, setDestination] = useState<Location | null>(savedState?.destination || null);
  const [selectedDate, setSelectedDate] = useState<string>(savedState?.selectedDate || "");
  const [selectedTime, setSelectedTime] = useState(savedState?.selectedTime || "13:00");
  const [isReturn, setIsReturn] = useState(savedState?.isReturn || false);
  const [stops, setStops] = useState<Stop[]>(savedState?.stops || []);
  const [showWeather, setShowWeather] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [showJetSelector, setShowJetSelector] = useState(false);
  const [selectedJet, setSelectedJet] = useState<string | undefined>(savedState?.selectedJet);
  const [routeDistance, setRouteDistance] = useState<number>(savedState?.routeDistance || 0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>(
    savedState?.bookingDetails || {
      passengers: 1,
      luggage: 0,
      pets: 0
    }
  );

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const state = {
      origin,
      destination,
      selectedDate,
      selectedTime,
      isReturn,
      stops,
      selectedJet,
      routeDistance,
      bookingDetails
    };
    localStorage.setItem('bookingState', JSON.stringify(state));
  }, [origin, destination, selectedDate, selectedTime, isReturn, stops, selectedJet, routeDistance, bookingDetails]);

  const handleOriginChange = (location: Location) => {
    setOrigin(location);
  };

  const handleDestinationChange = (location: Location) => {
    setDestination(location);
    setShowWeather(true);
  };

  const handleStopChange = (stop: Stop, index: number) => {
    setStops(prev => {
      const newStops = [...prev];
      newStops[index] = stop;
      return newStops;
    });
  };

  const addStop = () => {
    setStops(prev => [...prev, { lat: 0, lng: 0, address: '', date: '', time: '' }]);
  };

  const removeStop = (index: number) => {
    setStops(prev => prev.filter((_, i) => i !== index));
  };

  const calculateRoute = () => {
    if (!origin || !destination) return;

    try {
      const R = 6371; // Earth's radius in km
      const dLat = (destination.lat - origin.lat) * Math.PI / 180;
      const dLon = (destination.lng - origin.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      setRouteDistance(distance);
      setShowJetSelector(true);
      setIsFullscreen(true);
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  const handleJetSelect = (jetId: string) => {
    setSelectedJet(jetId);
    setShowJetSelector(false);
    setIsFullscreen(false);
  };

  const handleBack = () => {
    if (showJetSelector) {
      setShowJetSelector(false);
      setIsFullscreen(false);
    }
  };

  return {
    origin,
    destination,
    selectedDate,
    selectedTime,
    isReturn,
    stops,
    showWeather,
    isDarkTheme,
    showJetSelector,
    selectedJet,
    routeDistance,
    isFullscreen,
    bookingDetails,
    setSelectedDate,
    setSelectedTime,
    handleOriginChange,
    handleDestinationChange,
    handleStopChange,
    addStop,
    removeStop,
    setShowWeather,
    setIsDarkTheme,
    calculateRoute,
    handleJetSelect,
    handleBack,
    setBookingDetails,
  };
}