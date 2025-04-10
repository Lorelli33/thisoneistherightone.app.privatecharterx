'use client';

import React, { useState, useEffect } from 'react';
import LocationSearch from '@/components/LocationSearch';
import DateSelector from '@/components/DateSelector';
import MapboxMap from '@/components/Map';
import RouteInfo from '@/components/RouteInfo';
import ThemeToggle from '@/components/ThemeToggle';
import WeatherWidget from '@/components/WeatherWidget';
import TokenRewardsWidget from '@/components/TokenRewardsWidget';
import WalletMenu from '@/components/WalletMenu';
import JetSelector from '@/components/JetSelector';
import BookingSummary from '@/components/BookingSummary';
import Logo from '@/components/Logo';
import Footer from '@/components/Footer';
import NavigationMenu from '@/components/NavigationMenu';
import ChatSupport from '@/components/ChatSupport';
import Dashboard from '@/components/Dashboard';
import type { Location, RouteInfo as RouteInfoType, Weather, Stop, JetCategory, BookingDetails } from '@/types';
import { jetCategories } from '@/data/jets';

export default function Home() {
  // Theme state
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [showJetSelector, setShowJetSelector] = useState(false);
  const [showBookingSummary, setShowBookingSummary] = useState(false);
  const [showTokenRewards, setShowTokenRewards] = useState(false);
  const [showRouteInfo, setShowRouteInfo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardView, setDashboardView] = useState('dashboard');

  // Booking state
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState("13:00");
  const [isReturn, setIsReturn] = useState(false);
  const [stops, setStops] = useState<Stop[]>([]);
  const [showMultiLeg, setShowMultiLeg] = useState(false);

  // Route state
  const [routeInfo, setRouteInfo] = useState<RouteInfoType | null>(null);
  const [destinationWeather, setDestinationWeather] = useState<Weather | null>(null);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [selectedJet, setSelectedJet] = useState<string | undefined>(undefined);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    passengers: 1,
    luggage: 0,
    pets: 0
  });

  // Load saved state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('bookingState');
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          if (state.origin) setOrigin(state.origin);
          if (state.destination) setDestination(state.destination);
          if (state.selectedDate) setSelectedDate(state.selectedDate);
          if (state.selectedTime) setSelectedTime(state.selectedTime);
          if (state.isReturn) setIsReturn(state.isReturn);
          if (state.stops) setStops(state.stops);
          if (state.selectedJet) setSelectedJet(state.selectedJet);
          if (state.bookingDetails) setBookingDetails(state.bookingDetails);
        } catch (error) {
          console.error('Error loading saved state:', error);
        }
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const state = {
        origin,
        destination,
        selectedDate,
        selectedTime,
        isReturn,
        stops,
        selectedJet,
        bookingDetails
      };
      localStorage.setItem('bookingState', JSON.stringify(state));
    }
  }, [origin, destination, selectedDate, selectedTime, isReturn, stops, selectedJet, bookingDetails]);

  // Only show weather widget when destination is selected and address is valid
  const shouldShowWeather = destination?.address && destination.address.length > 0;

  // Get selected jet details
  const selectedJetDetails = selectedJet ? jetCategories.find(jet => jet.id === selectedJet) : undefined;

  // Handlers
  const handleOriginChange = (location: Location) => {
    setOrigin(location);
  };

  const handleDestinationChange = (location: Location) => {
    setDestination(location);
  };

  const handleStopChange = (stop: Stop, index: number) => {
    setStops(prev => {
      const newStops = [...prev];
      newStops[index] = stop;
      return newStops;
    });
  };

  const addStop = () => {
    setStops(prev => [...prev, { lat: 0, lng: 0, address: '', date: selectedDate || '', time: selectedTime || '' }]);
  };

  const removeStop = (index: number) => {
    setStops(prev => prev.filter((_, i) => i !== index));
  };

  const calculateRoute = () => {
    if (!origin || !destination) return;

    try {
      const R = 6371; // Earth's radius in km
      
      // Calculate total distance including stops
      let totalDistance = 0;
      let points = [origin, ...stops, destination];
      
      for (let i = 0; i < points.length - 1; i++) {
        const point1 = points[i];
        const point2 = points[i + 1];
        
        const dLat = (point2.lat - point1.lat) * Math.PI / 180;
        const dLon = (point2.lng - point1.lng) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        totalDistance += R * c;
      }

      setRouteDistance(totalDistance);
      setShowTokenRewards(true);
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
    setShowBookingSummary(true);
  };

  const handleBack = () => {
    if (showBookingSummary) {
      setShowBookingSummary(false);
      setShowJetSelector(true);
      setIsFullscreen(true);
    } else if (showJetSelector) {
      setShowJetSelector(false);
      setIsFullscreen(false);
    }
  };

  const handleDateContinue = () => {
    if (selectedDate && selectedTime) {
      setShowDateSelector(false);
      calculateRoute();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto">
          <div className="flex items-center justify-between py-4 px-6">
            <div className="flex items-center gap-8">
              <Logo />
              <NavigationMenu />
            </div>
            <div className="flex items-center gap-4">
              <WalletMenu onShowDashboard={() => {}} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-[108px]">
        {/* Map Container */}
        <div className="fixed inset-x-2.5 top-[108px] bottom-2.5 rounded-3xl bg-white shadow-2xl overflow-hidden">
          {/* Map */}
          <div className="absolute inset-0">
            <MapboxMap
              origin={origin}
              destination={destination}
              isReturn={isReturn}
              stops={stops}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
            />
          </div>

          {/* Booking Interface */}
          <div 
            className={`absolute z-10 transition-all duration-300 ease-in-out ${
              isFullscreen 
                ? 'inset-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20' 
                : showBookingSummary
                  ? 'inset-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20'
                  : 'top-4 left-4'
            }`}
          >
            <div 
              className={`h-full ${
                isFullscreen || showBookingSummary ? 'w-full' : 'w-[320px]'
              }`}
            >
              {showDateSelector ? (
                <DateSelector
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onDateSelect={setSelectedDate}
                  onTimeSelect={setSelectedTime}
                  onBack={() => setShowDateSelector(false)}
                  onContinue={handleDateContinue}
                />
              ) : showJetSelector ? (
                <JetSelector
                  selectedJet={selectedJet}
                  onSelect={handleJetSelect}
                  requiredCapacity={bookingDetails.passengers}
                  distance={routeDistance}
                  onBack={handleBack}
                  isFullscreen={isFullscreen}
                  origin={origin}
                  destination={destination}
                />
              ) : showBookingSummary && selectedJetDetails ? (
                <BookingSummary
                  origin={origin!}
                  destination={destination!}
                  stops={stops}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  isReturn={isReturn}
                  bookingDetails={bookingDetails}
                  selectedJet={selectedJetDetails}
                  onBack={handleBack}
                />
              ) : (
                <LocationSearch
                  onOriginChange={handleOriginChange}
                  onDestinationChange={handleDestinationChange}
                  onDateSelect={() => setShowDateSelector(true)}
                  onCalculate={calculateRoute}
                  isReturn={isReturn}
                  onReturnChange={setIsReturn}
                  stops={stops}
                  onStopChange={handleStopChange}
                  onAddStop={addStop}
                  onRemoveStop={removeStop}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  showMultiLeg={showMultiLeg}
                  onMultiLegChange={setShowMultiLeg}
                />
              )}
            </div>
          </div>

          {/* Map Tools */}
          <div className="absolute bottom-4 right-4 z-50">
            <div className="flex flex-col gap-4">
              {showTokenRewards && (
                <TokenRewardsWidget 
                  distance={routeDistance}
                  onClose={() => setShowTokenRewards(false)}
                />
              )}
              {shouldShowWeather && (
                <WeatherWidget 
                  location={destination}
                  onClose={() => setDestination(null)}
                />
              )}
            </div>
          </div>

          {showRouteInfo && routeInfo && (
            <div className="absolute bottom-4 left-4 right-4 mx-auto max-w-4xl z-40">
              <RouteInfo
                routeInfo={routeInfo}
                destinationWeather={destinationWeather}
                onClose={() => setShowRouteInfo(false)}
              />
            </div>
          )}
        </div>

        {/* Spacer for content below fixed map */}
        <div className="h-[calc(100vh-100px)]" />
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-50">
        <Footer />
      </footer>

      {/* Chat Support */}
      <ChatSupport />

      {/* Modals */}
      {showDashboard && (
        <Dashboard 
          onClose={() => setShowDashboard(false)}
          onShowHistory={() => {}}
          initialView={dashboardView}
        />
      )}
    </div>
  );
}