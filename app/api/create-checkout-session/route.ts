import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

export async function POST(request: Request) {
  try {
    const { offerId, offerType, price, currency, title } = await request.json();

    if (!offerId || !price || !currency || !title) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    let successUrl = `${process.env.NEXT_PUBLIC_URL}/booking-success?session_id={CHECKOUT_SESSION_ID}`;
    let cancelUrl = `${process.env.NEXT_PUBLIC_URL}/fixed-offers`;
    let metadata: Record<string, string> = { offerId, offerType };

    // Different handling based on offer type
    if (offerType === 'visa') {
      successUrl = `${process.env.NEXT_PUBLIC_URL}/visa-success?session_id={CHECKOUT_SESSION_ID}`;
      cancelUrl = `${process.env.NEXT_PUBLIC_URL}/visa-services`;
      metadata = {
        ...metadata,
        service_type: 'visa',
        package_id: offerId
      };
    } else if (offerType === 'empty_leg') {
      metadata = {
        ...metadata,
        service_type: 'empty_leg',
        offer_id: offerId
      };
    } else {
      metadata = {
        ...metadata,
        service_type: 'fixed_offer',
        offer_id: offerId
      };
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: title,
              metadata
            },
            unit_amount: price * 100 // Convert to cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}