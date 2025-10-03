import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ModalProps {
  open: boolean;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const ConfirmDisconnectModal: React.FC<ModalProps> = ({
  open,
  message,
  onClose,
  onConfirm,
  isLoading,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Confirmation</DialogTitle>
        </DialogHeader>

        <div className='py-4'>
          <p className='text-foreground text-sm'>{message}</p>
        </div>

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Confirming...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDisconnectModal;
