import React from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Download, FileText, Image, File } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

const FileAttachment = ({ message, isOwn }) => {
  const fileUrl = useQuery(api.files.getFileUrl, 
    message.storageId ? { storageId: message.storageId } : "skip"
  );

  if (!message.fileName || !message.storageId) {
    return null;
  }

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return <Image className="h-4 w-4" />;
    }
    if (['pdf'].includes(extension)) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = message.fileName;
      link.target = '_blank';
      link.click();
    }
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      isOwn ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-border'
    }`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {getFileIcon(message.fileName)}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{message.fileName}</p>
          {message.fileSize && (
            <p className="text-xs text-muted-foreground">
              {formatFileSize(message.fileSize)}
            </p>
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleDownload}
        disabled={!fileUrl}
        className="h-8 px-2"
      >
        <Download className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default FileAttachment;