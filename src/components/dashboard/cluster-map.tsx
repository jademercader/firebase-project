import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Skeleton } from '../ui/skeleton';
import { MapPin } from 'lucide-react';
import { useData } from '@/app/page';

interface ClusterMapProps {
  isLoading: boolean;
}

export function ClusterMap({ isLoading }: ClusterMapProps) {
  const mapImage = PlaceHolderImages.find((img) => img.id === 'map');
  const { clusters } = useData();

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-full" />;
    }

    if (!mapImage) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MapPin className="w-12 h-12 mb-4" />
            <p>Map image not available.</p>
        </div>
      );
    }

    return (
      <>
        <Image
          src={mapImage.imageUrl}
          alt={mapImage.description}
          data-ai-hint={mapImage.imageHint}
          fill
          className="object-cover rounded-md"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/30">
            <div className="text-center bg-black/50 text-white p-4 rounded-lg">
                <h3 className="font-bold text-lg">Cluster Visualization</h3>
                 <p className="text-sm">
                    {clusters.length > 0 
                        ? `${clusters.length} clusters identified. Interactive map coming soon.`
                        : 'Run analysis to see cluster locations.'
                    }
                </p>
            </div>
        </div>
      </>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-headline">Barangay Cluster Visualization</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] md:h-[500px] relative">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
