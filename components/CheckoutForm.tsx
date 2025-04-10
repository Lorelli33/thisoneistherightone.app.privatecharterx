import React, { useState } from 'react';
import { CreditCard, Wallet, Send, ArrowRight, Calendar, User, Mail, Phone, Check } from 'lucide-react';
import { createCheckoutSession, processCryptoPayment, sendPaymentRequest } from '../lib/payments';
import { web3Service } from '../lib/web3';
import { useAuth } from '../context/AuthContext';

interface CheckoutFormProps {
  offerId: string;
  offerType: 'fixed_offer' | 'empty_leg' | 'visa';
  title: string;
  price: number;
  currency: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CheckoutForm({ 
  offerId, 
  offerType, 
  title, 
  price, 
  currency, 
  onClose,
  onSuccess
}: CheckoutFormProps) {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto' | 'request'>('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    birthdate: '',
    additionalServices: {
      airportTransfer: false,
      catering: false,
      concierge: false,
      hotelBooking: false
    },
    specialRequests: ''
  });

  const handleUserInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setUserInfo(prev => ({
        ...prev,
        additionalServices: {
          ...prev.additionalServices,
          [name]: checked
        }
      }));
    } else {
      setUserInfo(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate user info
      if (!userInfo.name || !userInfo.email || !userInfo.phone) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Calculate final price with additional services
      let finalPrice = price;
      if (userInfo.additionalServices.airportTransfer) finalPrice += 250;
      if (userInfo.additionalServices.catering) finalPrice += 350;
      if (userInfo.additionalServices.concierge) finalPrice += 200;
      if (userInfo.additionalServices.hotelBooking) finalPrice += 150;

      switch (paymentMethod) {
        case 'card':
          const { error: stripeError } = await createCheckoutSession({
            offerId,
            offerType,
            price: finalPrice,
            currency,
            title,
            userInfo
          });

          if (stripeError) throw new Error(stripeError);
          break;

        case 'crypto':
          const address = web3Service.getAccount();
          if (!address) {
            throw new Error('Please connect your wallet first');
          }

          // Convert price to ETH (mock conversion rate)
          const priceInEth = currency === 'EUR' ? finalPrice / 3000 : finalPrice / 3500;
          
          const { success: cryptoSuccess, error: cryptoError } = await processCryptoPayment(
            offerId,
            offerType,
            priceInEth,
            address,
            userInfo
          );

          if (cryptoError) throw new Error(cryptoError);
          if (cryptoSuccess) {
            setSuccess(true);
            if (onSuccess) onSuccess();
          }
          break;

        case 'request':
          const { success: requestSuccess, error: requestError } = await sendPaymentRequest(
            offerId,
            offerType,
            userInfo.email,
            userInfo
          );

          if (requestError) throw new Error(requestError);
          if (requestSuccess) {
            setSuccess(true);
            if (onSuccess) onSuccess();
          }
          break;
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-green-600" />
        </div>
        <h3 className="text-xl font-bold mb-2">Request Submitted Successfully!</h3>
        <p className="text-gray-600 mb-6">
          {paymentMethod === 'request' 
            ? 'Your booking request has been sent. Our team will contact you shortly.'
            : 'Your payment has been processed successfully. You will receive a confirmation email shortly.'}
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold mb-4">Complete Your Booking</h2>

      {/* User Information */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-700">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="name"
                value={userInfo.name}
                onChange={handleUserInfoChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={userInfo.email}
                onChange={handleUserInfoChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={userInfo.phone}
                onChange={handleUserInfoChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                name="birthdate"
                value={userInfo.birthdate}
                onChange={handleUserInfoChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Services */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-700">Additional Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="airportTransfer"
              name="airportTransfer"
              checked={userInfo.additionalServices.airportTransfer}
              onChange={handleUserInfoChange}
              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
            />
            <div>
              <label htmlFor="airportTransfer" className="font-medium text-gray-900">Airport Transfer</label>
              <p className="text-sm text-gray-500">€250</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="catering"
              name="catering"
              checked={userInfo.additionalServices.catering}
              onChange={handleUserInfoChange}
              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
            />
            <div>
              <label htmlFor="catering" className="font-medium text-gray-900">Premium Catering</label>
              <p className="text-sm text-gray-500">€350</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="concierge"
              name="concierge"
              checked={userInfo.additionalServices.concierge}
              onChange={handleUserInfoChange}
              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
            />
            <div>
              <label htmlFor="concierge" className="font-medium text-gray-900">Concierge Service</label>
              <p className="text-sm text-gray-500">€200</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="hotelBooking"
              name="hotelBooking"
              checked={userInfo.additionalServices.hotelBooking}
              onChange={handleUserInfoChange}
              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
            />
            <div>
              <label htmlFor="hotelBooking" className="font-medium text-gray-900">Hotel Booking Assistance</label>
              <p className="text-sm text-gray-500">€150</p>
            </div>
          </div>
        </div>
      </div>

      {/* Special Requests */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Special Requests
        </label>
        <textarea
          name="specialRequests"
          value={userInfo.specialRequests}
          onChange={handleUserInfoChange}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
          placeholder="Any special requirements or preferences..."
        ></textarea>
      </div>

      {/* Price Summary */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-medium text-gray-700 mb-2">Price Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Base Price</span>
            <span className="font-medium">{currency}{price.toLocaleString()}</span>
          </div>
          {userInfo.additionalServices.airportTransfer && (
            <div className="flex justify-between">
              <span className="text-gray-600">Airport Transfer</span>
              <span className="font-medium">{currency}250</span>
            </div>
          )}
          {userInfo.additionalServices.catering && (
            <div className="flex justify-between">
              <span className="text-gray-600">Premium Catering</span>
              <span className="font-medium">{currency}350</span>
            </div>
          )}
          {userInfo.additionalServices.concierge && (
            <div className="flex justify-between">
              <span className="text-gray-600">Concierge Service</span>
              <span className="font-medium">{currency}200</span>
            </div>
          )}
          {userInfo.additionalServices.hotelBooking && (
            <div className="flex justify-between">
              <span className="text-gray-600">Hotel Booking Assistance</span>
              <span className="font-medium">{currency}150</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
            <span>Total (Estimated)</span>
            <span>{currency}{(
              price + 
              (userInfo.additionalServices.airportTransfer ? 250 : 0) +
              (userInfo.additionalServices.catering ? 350 : 0) +
              (userInfo.additionalServices.concierge ? 200 : 0) +
              (userInfo.additionalServices.hotelBooking ? 150 : 0)
            ).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-700">Payment Method</h3>
        <div className="space-y-3">
          <button
            onClick={() => setPaymentMethod('card')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors ${
              paymentMethod === 'card'
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium">Credit Card</div>
              <div className="text-sm text-gray-500">Pay securely with Stripe</div>
            </div>
          </button>

          <button
            onClick={() => setPaymentMethod('crypto')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors ${
              paymentMethod === 'crypto'
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <Wallet size={20} className="text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium">Cryptocurrency</div>
              <div className="text-sm text-gray-500">Pay with ETH or other tokens</div>
            </div>
          </button>

          <button
            onClick={() => setPaymentMethod('request')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors ${
              paymentMethod === 'request'
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <Send size={20} className="text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium">Request Invoice</div>
              <div className="text-sm text-gray-500">Get contacted by our team</div>
            </div>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handlePayment}
          disabled={loading}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Complete Booking</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}