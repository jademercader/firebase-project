
import { LogOut } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LogoutPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <div className="flex justify-center mb-4">
             <LogOut className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Logged Out</CardTitle>
          <CardDescription className="text-center">You have been successfully signed out.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" passHref>
            <Button type="submit" className="w-full">
              Login Again
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
