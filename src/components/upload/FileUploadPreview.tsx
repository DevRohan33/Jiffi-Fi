
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadPreviewProps {
  file: File | null;
  onClear: () => void;
}

const FileUploadPreview = ({ file, onClear }: FileUploadPreviewProps) => {
  const [preview, setPreview] = useState<string | null>(null);

  React.useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      setPreview('pdf');
    }
  }, [file]);

  if (!file) return null;

  return (
    <div className="relative border rounded-md p-2 mt-2 bg-white">
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-sm mb-1">
        <span className="font-semibold">File:</span> {file.name}
      </div>

      {preview ? (
        preview === 'pdf' ? (
          <div className="bg-muted h-32 flex items-center justify-center rounded">
            <p className="text-sm text-muted-foreground">PDF Document</p>
          </div>
        ) : (
          <div className="relative h-48 overflow-hidden rounded">
            <img
              src={preview}
              alt="Preview"
              className="object-contain w-full h-full"
            />
          </div>
        )
      ) : (
        <div className="bg-muted h-32 flex items-center justify-center rounded">
          <p className="text-sm text-muted-foreground">Loading preview...</p>
        </div>
      )}
    </div>
  );
};

export default FileUploadPreview;
