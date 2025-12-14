
'use server';

import { z } from 'zod';

const NominatimResponseSchema = z.array(z.object({
    lat: z.string(),
    lon: z.string(),
    display_name: z.string(),
}));


/**
 * Geocodes an address string using the free Nominatim (OpenStreetMap) API.
 * @param address The address to geocode.
 * @returns A promise that resolves to an object with lat and lng, or null if not found.
 * @throws {Error} If there's a critical API error.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    
    const query = new URLSearchParams({
        q: address,
        format: 'json',
        limit: '1'
    });
    
    const url = `https://nominatim.openstreetmap.org/search?${query.toString()}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'BarangayHealthInsights/1.0 (https://your-app-url.com; your-contact-email@example.com)'
            }
        });

        if (!response.ok) {
            console.error(`Nominatim API returned status: ${response.status}`);
            // Don't throw for server errors, just return null as it might be temporary.
            return null;
        }

        const data = await response.json();
        
        const validatedData = NominatimResponseSchema.safeParse(data);

        if (!validatedData.success) {
            console.error('Failed to parse Nominatim API response:', validatedData.error);
            return null;
        }

        if (validatedData.data.length > 0) {
            const location = validatedData.data[0];
            return { lat: parseFloat(location.lat), lng: parseFloat(location.lon) };
        }
        
        return null; // No results found
    } catch (error) {
        console.error('Error during geocoding fetch:', error);
        // For unexpected fetch errors, we can choose to throw or return null.
        // Throwing is safer to halt the process if it's a network-level issue.
        throw new Error('An unexpected error occurred during geocoding.');
    }
}
