'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@kit/ui/alert-dialog';

interface CancelSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function CancelSubscriptionDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: CancelSubscriptionDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle>Cancel Pro Subscription</AlertDialogTitle>
              <AlertDialogDescription className="mt-2">
                Are you sure you want to cancel your Pro subscription?
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        
        <div className="py-4 space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">What happens when you cancel:</p>
                <ul className="text-amber-700 space-y-1">
                  <li>• You'll keep Pro access until your billing period ends</li>
                  <li>• Your decks and data will be preserved</li>
                  <li>• You can resubscribe anytime to regain full access</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Keep Subscription
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Canceling...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Yes, Cancel Subscription
              </div>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}