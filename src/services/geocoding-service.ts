
'use server';

import { z } from 'zod';

const GeocodeResponseSchema = z.array(z.object({
    lat: z.string(),
    lon: z.string(),
    display_name: z.string(),
}));

/**
 * Geocodes an address string using the Nominatim API.
 * @param address The address to geocode.
 * @returns A promise that resolves to an object with lat and lng, or null if not found.
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
                'User-Agent': 'BarangayHealthInsights/1.0 (Firebase Studio App)'
            }
        });

        if (!response.ok) {
            console.error(`Geocoding API failed with status: ${response.status}`);
            return null;
        }

        const data = await response.json();
        const validatedData = GeocodeResponseSchema.safeParse(data);

        if (validatedData.success && validatedData.data.length > 0) {
            const firstResult = validatedData.data[0];
            const lat = parseFloat(firstResult.lat);
            const lng = parseFloat(firstResult.lon);

            if (!isNaN(lat) && !isNaN(lng)) {
                return { lat, lng };
            }
        }
        return null;
    } catch (error) {
        console.error('Error during geocoding fetch:', error);
        return null;
    }
}
