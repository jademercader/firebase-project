
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
 * @throws {Error} If the API key is invalid or there's a critical API error.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.error("Google Maps API key is not configured.");
        throw new Error("Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.");
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
            // Don't throw here, might be a temporary issue. Return null.
            return null;
        }

        if (validatedData.data.status !== 'OK') {
             console.error(`Geocoding API returned status: ${validatedData.data.status}. Error: ${validatedData.data.error_message}`);
             // If the error is due to the key or permissions, we should stop and throw an error.
             if (['REQUEST_DENIED', 'INVALID_REQUEST'].includes(validatedData.data.status) && validatedData.data.error_message?.includes('API key')) {
                throw new Error(`Google Geocoding API Error: ${validatedData.data.error_message}. Please check your API key and permissions.`);
             }
             return null; // For other non-OK statuses like ZERO_RESULTS, just return null.
        }

        if (validatedData.data.results.length > 0) {
            const location = validatedData.data.results[0].geometry.location;
            return { lat: location.lat, lng: location.lng };
        }
        
        return null; // No results found
    } catch (error) {
        console.error('Error during geocoding fetch:', error);
        // Re-throw the error if it's one of our critical, identified issues.
        if (error instanceof Error) {
            throw error;
        }
        // For unexpected fetch errors, we can choose to throw or return null.
        // Throwing is safer to halt the process.
        throw new Error('An unexpected error occurred during geocoding.');
    }
}

