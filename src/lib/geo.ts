import { NextRequest } from 'next/server';

interface LocationData {
  location: string | null;
  country: string | null;
  city: string | null;
}

export const getLocationFromRequest = (
  request: NextRequest,
  googleLocale?: string
): LocationData => {
  const vercelCountry = request.headers.get('x-vercel-ip-country');
  const vercelCity = request.headers.get('x-vercel-ip-city');

  if (vercelCountry) {
    const location = vercelCity ? `${vercelCity}, ${vercelCountry}` : vercelCountry;
    return {
      location: location || null,
      country: vercelCountry,
      city: vercelCity,
    };
  }

  if (googleLocale) {
    const parts = googleLocale.split('-');
    if (parts.length >= 2) {
      const country = parts[parts.length - 1].toUpperCase();
      return {
        location: country,
        country,
        city: null,
      };
    }
  }

  return {
    location: null,
    country: null,
    city: null,
  };
};
