import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function ClusterMap() {
  const mapImage = PlaceHolderImages.find((img) => img.id === 'map');

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-headline">Barangay Cluster Visualization</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] md:h-[500px] relative">
        {mapImage && (
          <Image
            src={mapImage.imageUrl}
            alt={mapImage.description}
            data-ai-hint={mapImage.imageHint}
            fill
            className="object-cover rounded-md"
            priority
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center p-4">
            <p className="text-center bg-black/50 text-white p-4 rounded-lg">
                Interactive map will be displayed here showing cluster locations.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
