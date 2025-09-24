'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getCleansingSuggestions } from '@/app/actions';
import { mockHealthRecords } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Bot, Sparkles } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export function CleansingSuggestions() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState('');
  const { toast } = useToast();

  const handleCleanseData = async () => {
    setIsLoading(true);
    setSuggestions('');
    const input = {
      healthRecordsData: JSON.stringify(mockHealthRecords),
    };
    const result = await getCleansingSuggestions(input);
    if (result.success && result.data) {
      setSuggestions(result.data.dataErrors);
    } else {
      toast({
        variant: 'destructive',
        title: 'Cleansing Failed',
        description: result.error || 'Could not get suggestions. Please try again.',
      });
    }
    setIsLoading(false);
  };

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Automated Data Cleansing
        </CardTitle>
        <CardDescription>
          Use AI to identify potential errors like missing values, outliers, and inconsistencies in your data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="AI suggestions will appear here..."
          value={suggestions}
          readOnly
          className="h-64 resize-none bg-secondary/50"
        />
        {isLoading && (
            <div className="space-y-2 mt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[80%]" />
            </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2">
        <Button onClick={handleCleanseData} disabled={isLoading}>
          {isLoading ? 'Scanning...' : 'Scan for Errors'}
        </Button>
        <Button variant="outline" disabled={!suggestions || isLoading}>
          Apply Suggestions
        </Button>
      </CardFooter>
    </Card>
  );
}
