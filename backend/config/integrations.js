/**
 * Third-party Platform Integrations Configuration
 * Mayfair Hotel Management System
 */

const integrations = {
  // MakeMyTrip Integration
  makemytrip: {
    enabled: process.env.MAKEMYTRIP_ENABLED === 'true',
    baseUrl: 'https://affiliate-api.makemytrip.com',
    credentials: {
      partnerId: process.env.MAKEMYTRIP_PARTNER_ID,
      apiKey: process.env.MAKEMYTRIP_API_KEY,
      secretKey: process.env.MAKEMYTRIP_SECRET_KEY,
    },
    endpoints: {
      inventory: '/hotels/v2/inventory',
      pricing: '/hotels/v2/pricing',
      booking: '/hotels/v2/booking',
      availability: '/hotels/v2/availability',
    },
    syncSettings: {
      autoSync: true,
      syncFrequency: '*/30 * * * *', // Every 30 minutes
      maxRetries: 3,
      timeout: 30000,
    },
    mapping: {
      hotelId: process.env.MAKEMYTRIP_HOTEL_ID,
      currency: 'INR',
      taxIncluded: true,
    }
  },

  // Airbnb Integration
  airbnb: {
    enabled: process.env.AIRBNB_ENABLED === 'true',
    baseUrl: 'https://api.airbnb.com',
    credentials: {
      clientId: process.env.AIRBNB_CLIENT_ID,
      clientSecret: process.env.AIRBNB_CLIENT_SECRET,
      accessToken: process.env.AIRBNB_ACCESS_TOKEN,
    },
    endpoints: {
      listings: '/v2/listings',
      pricing: '/v2/pricing_rules',
      calendar: '/v2/calendar',
      reservations: '/v2/reservations',
    },
    syncSettings: {
      autoSync: true,
      syncFrequency: '0 */2 * * *', // Every 2 hours
      maxRetries: 3,
      timeout: 30000,
    },
    mapping: {
      listingId: process.env.AIRBNB_LISTING_ID,
      currency: 'INR',
      instantBooking: false,
    }
  },

  // Booking.com Integration
  booking_com: {
    enabled: process.env.BOOKING_COM_ENABLED === 'true',
    baseUrl: 'https://supply-xml.booking.com',
    credentials: {
      hotelId: process.env.BOOKING_COM_HOTEL_ID,
      username: process.env.BOOKING_COM_USERNAME,
      password: process.env.BOOKING_COM_PASSWORD,
    },
    endpoints: {
      inventory: '/hotels/ota/OTA_HotelInvCount',
      rates: '/hotels/ota/OTA_HotelRateAmount',
      availability: '/hotels/ota/OTA_HotelAvail',
      reservations: '/hotels/ota/OTA_HotelRes',
    },
    syncSettings: {
      autoSync: true,
      syncFrequency: '0 * * * *', // Every hour
      maxRetries: 3,
      timeout: 45000,
    },
    mapping: {
      hotelCode: process.env.BOOKING_COM_HOTEL_CODE,
      currency: 'INR',
      ratePlan: 'BAR', // Best Available Rate
    }
  },

  // Yatra Integration
  yatra: {
    enabled: process.env.YATRA_ENABLED === 'true',
    baseUrl: 'https://affiliate.yatra.com/webservice',
    credentials: {
      partnerId: process.env.YATRA_PARTNER_ID,
      password: process.env.YATRA_PASSWORD,
      agentCode: process.env.YATRA_AGENT_CODE,
    },
    endpoints: {
      search: '/HotelService.svc/GetHotelSearchResults',
      details: '/HotelService.svc/GetHotelDetails',
      booking: '/HotelService.svc/BookHotel',
      cancellation: '/HotelService.svc/CancelBooking',
    },
    syncSettings: {
      autoSync: false, // Manual sync only
      syncFrequency: null,
      maxRetries: 3,
      timeout: 30000,
    },
    mapping: {
      hotelCode: process.env.YATRA_HOTEL_CODE,
      cityCode: process.env.YATRA_CITY_CODE,
      currency: 'INR',
    }
  },

  // EaseMyTrip Integration
  easemytrip: {
    enabled: process.env.EASEMYTRIP_ENABLED === 'true',
    baseUrl: 'https://affiliate.easemytrip.com/webservice',
    credentials: {
      agentId: process.env.EASEMYTRIP_AGENT_ID,
      password: process.env.EASEMYTRIP_PASSWORD,
      ipAddress: process.env.EASEMYTRIP_IP_ADDRESS,
    },
    endpoints: {
      search: '/HotelAPI/Search',
      details: '/HotelAPI/Details',
      booking: '/HotelAPI/Booking',
      voucher: '/HotelAPI/Voucher',
    },
    syncSettings: {
      autoSync: false,
      syncFrequency: null,
      maxRetries: 3,
      timeout: 30000,
    },
    mapping: {
      hotelCode: process.env.EASEMYTRIP_HOTEL_CODE,
      currency: 'INR',
      nationality: 'IN',
    }
  },

  // Trivago Integration (Meta Search)
  trivago: {
    enabled: process.env.TRIVAGO_ENABLED === 'true',
    baseUrl: 'https://connect.trivago.com',
    credentials: {
      hotelId: process.env.TRIVAGO_HOTEL_ID,
      apiKey: process.env.TRIVAGO_API_KEY,
    },
    endpoints: {
      inventory: '/v1/inventory',
      rates: '/v1/rates',
      availability: '/v1/availability',
    },
    syncSettings: {
      autoSync: true,
      syncFrequency: '0 */6 * * *', // Every 6 hours
      maxRetries: 3,
      timeout: 30000,
    },
    mapping: {
      currency: 'INR',
      rateType: 'room_only',
    }
  },

  // Google My Business / Maps Integration
  google_maps: {
    enabled: process.env.GOOGLE_MAPS_ENABLED === 'true',
    baseUrl: 'https://mybusiness.googleapis.com',
    credentials: {
      apiKey: process.env.GOOGLE_MAPS_API_KEY,
      accountId: process.env.GOOGLE_MY_BUSINESS_ACCOUNT_ID,
      locationId: process.env.GOOGLE_MY_BUSINESS_LOCATION_ID,
    },
    endpoints: {
      location: '/v4/accounts/{accountId}/locations/{locationId}',
      posts: '/v4/accounts/{accountId}/locations/{locationId}/posts',
      reviews: '/v4/accounts/{accountId}/locations/{locationId}/reviews',
    },
    syncSettings: {
      autoSync: false,
      syncFrequency: null,
      maxRetries: 3,
      timeout: 30000,
    },
    mapping: {
      businessName: 'Mayfair Hotel',
      address: 'Near BSNL Exchange, Mandi, Himachal Pradesh',
      phone: process.env.HOTEL_PHONE_NUMBER,
      website: process.env.HOTEL_WEBSITE_URL,
    }
  }
};

// Payment Gateway Integrations
const paymentGateways = {
  // Razorpay (Primary - Lower fees for Indian market)
  razorpay: {
    enabled: process.env.RAZORPAY_ENABLED === 'true',
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    currency: 'INR',
    methods: ['card', 'netbanking', 'upi', 'wallet'],
    fees: {
      domestic: 2.0, // 2% + GST
      international: 3.0, // 3% + GST
      upi: 0, // Free for UPI
    },
    settings: {
      autoCapture: true,
      partialPayment: true,
      description: 'Mayfair Hotel Payment',
      notes: {
        hotel: 'Mayfair Hotel, Mandi, HP'
      }
    }
  },

  // Stripe (Backup - Better for international)
  stripe: {
    enabled: process.env.STRIPE_ENABLED === 'true',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    currency: 'inr',
    methods: ['card'],
    fees: {
      domestic: 2.9, // 2.9% + ₹3
      international: 3.4, // 3.4% + ₹3
    },
    settings: {
      autoCapture: true,
      description: 'Mayfair Hotel Payment',
      statementDescriptor: 'MAYFAIR HOTEL',
    }
  },

  // PayU (Alternative)
  payu: {
    enabled: process.env.PAYU_ENABLED === 'true',
    merchantId: process.env.PAYU_MERCHANT_ID,
    secretKey: process.env.PAYU_SECRET_KEY,
    salt: process.env.PAYU_SALT,
    environment: process.env.NODE_ENV === 'production' ? 'live' : 'test',
    currency: 'INR',
    methods: ['card', 'netbanking', 'upi', 'emi'],
    fees: {
      card: 2.4, // 2.4% + GST
      netbanking: 15, // Flat ₹15 + GST
      upi: 0.7, // 0.7% + GST
    }
  }
};

// SMS Integration (for notifications)
const smsIntegration = {
  twilio: {
    enabled: process.env.TWILIO_ENABLED === 'true',
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    templates: {
      bookingConfirmation: 'Your booking at Mayfair Hotel is confirmed. Booking ID: {{booking_id}}. Check-in: {{check_in_date}}.',
      checkInReminder: 'Reminder: Check-in today at Mayfair Hotel. Booking ID: {{booking_id}}. Contact: +91-XXX-XXX-XXXX',
      paymentSuccess: 'Payment successful for booking {{booking_id}}. Amount: ₹{{amount}}. Thank you for choosing Mayfair Hotel.',
    }
  },
  
  // MSG91 (Alternative SMS provider for India)
  msg91: {
    enabled: process.env.MSG91_ENABLED === 'true',
    apiKey: process.env.MSG91_API_KEY,
    senderId: process.env.MSG91_SENDER_ID,
    route: '4', // Transactional SMS route
    country: '91', // India
  }
};

// Email Integration
const emailIntegration = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    from: {
      name: 'Mayfair Hotel',
      address: process.env.SMTP_FROM_EMAIL,
    }
  },
  
  templates: {
    bookingConfirmation: {
      subject: 'Booking Confirmation - Mayfair Hotel',
      template: 'booking-confirmation',
    },
    checkInReminder: {
      subject: 'Check-in Reminder - Mayfair Hotel',
      template: 'checkin-reminder',
    },
    receipt: {
      subject: 'Payment Receipt - Mayfair Hotel',
      template: 'payment-receipt',
    }
  }
};

module.exports = {
  integrations,
  paymentGateways,
  smsIntegration,
  emailIntegration
};
