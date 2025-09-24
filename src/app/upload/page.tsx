import AppLayout from '@/components/layout/app-layout';
import { FileUploader } from '@/components/upload/file-uploader';
import { DataTable } from '@/components/upload/data-table';
import { CleansingSuggestions } from '@/components/upload/cleansing-suggestions';

export default function UploadPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight font-headline">Data Upload & Cleansing</h2>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
             <FileUploader />
             <DataTable />
          </div>
          <div className="lg:col-span-1">
            <CleansingSuggestions />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
