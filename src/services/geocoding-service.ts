
'use server';

import { z } from 'zod';

const GoogleGeocodeResponseSchema = z.object({
    results: z.array(z.object({
        geometry: z.object({
            location: z.object({
                lat: z.number(),
                lng: z.number(),
            }),
        }),
        formatted_address: z.string(),
    })),
    status: z.string(),
    error_message: z.string().optional(),
});


/**
 * Geocodes an address string using the Google Geocoding API.
 * @param address The address to geocode.
 * @returns A promise that resolves to an object with lat and lng, or null if not found.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.error("Google Maps API key is not configured.");
        return null;
    }

    const query = new URLSearchParams({
        address: address,
        key: apiKey,
    });
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?${query.toString()}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const validatedData = GoogleGeocodeResponseSchema.safeParse(data);

        if (!validatedData.success) {
            console.error('Failed to parse Google Geocoding API response:', validatedData.error);
            return null;
        }

        if (validatedData.data.status !== 'OK') {
             console.error(`Geocoding API returned status: ${validatedData.data.status}. Error: ${validatedData.data.error_message}`);
             // If the error is due to the key, we should stop trying for this run.
             if (['REQUEST_DENIED'].includes(validatedData.data.status)) {
                throw new Error(`Google Geocoding API Error: ${validatedData.data.error_message}. Please check your API key and permissions.`);
             }
             return null;
        }

        if (validatedData.data.results.length > 0) {
            const location = validatedData.data.results[0].geometry.location;
            return { lat: location.lat, lng: location.lng };
        }
        
        return null;
    } catch (error) {
        console.error('Error during geocoding fetch:', error);
        // Re-throw the error if it's an API key issue to stop the process
        if (error instanceof Error && error.message.startsWith('Google Geocoding API Error')) {
            throw error;
        }
        return null;
    }
}
