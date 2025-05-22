import React from 'react';
import { useBill } from '@/contexts/BillContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionDetailProps {
  billId: string;
  onClose: () => void;
}

const TransactionDetail: React.FC<TransactionDetailProps> = ({ billId, onClose }) => {
  const { bills } = useBill();
  
  const bill = bills.find(b => b.id === billId);
  
  if (!bill) return null;

  const isImage = (url: string | null | undefined): boolean => {
    if (!url) return false;
    try {
      const ext = new URL(url).pathname.split('.').pop()?.toLowerCase();
      return !!ext && ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
    } catch {
      return false;
    }
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Title</span>
            <span className="text-lg font-medium">{bill.title || 'Untitled'}</span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Amount</span>
            <span className={`text-xl font-semibold ${bill.type === 'income' ? 'text-income' : 'text-expense'}`}>
              {bill.type === 'income' ? '+' : '-'}₹{bill.amount.toFixed(2)}
            </span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Type</span>
            <span className="capitalize font-medium">{bill.type}</span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Date</span>
            <div className="flex items-center">
              <Calendar className="mr-2 size-4 text-muted-foreground" />
              <span>{bill.date.toLocaleDateString()}</span>
            </div>
          </div>
          
          {bill.note && (
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Note</span>
              <div className="flex items-start">
                <FileText className="mr-2 mt-0.5 size-4 text-muted-foreground" />
                <span>{bill.note}</span>
              </div>
            </div>
          )}
          
          {bill.fileURL && (
            <div className="mt-4">
              <span className="text-sm font-medium text-muted-foreground mb-2 block">Attached File</span>
              <div className="border rounded-lg p-4 bg-muted/20">
                {isImage(bill.fileURL) ? (
                  <img
                    src={bill.fileURL}
                    alt="Attached receipt"
                    className="max-w-full h-auto rounded-md mx-auto max-h-[300px] object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText size={24} className="text-muted-foreground mr-2" />
                      <a
                        href={bill.fileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View File
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetail;