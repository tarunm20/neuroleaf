'use client';

import { useState } from 'react';
import { Button } from '@kit/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@kit/ui/select';
import { Badge } from '@kit/ui/badge';
import { shouldEnableTierSwitcher } from '../config/dev.config';

interface DevTierSwitcherProps {
  currentTier: 'free' | 'pro' | 'premium';
  accountId: string;
  onTierChange?: (newTier: 'free' | 'pro' | 'premium') => void;
}

export function DevTierSwitcher({ 
  currentTier, 
  accountId, 
  onTierChange 
}: DevTierSwitcherProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [selectedTier, setSelectedTier] = useState(currentTier);
  const [message, setMessage] = useState('');

  // Debug logging
  console.log('DevTierSwitcher - shouldEnableTierSwitcher():', shouldEnableTierSwitcher());
  console.log('DevTierSwitcher - process.env.NODE_ENV:', process.env.NODE_ENV);
  console.log('DevTierSwitcher - process.env.NEXT_PUBLIC_DEV_MODE:', process.env.NEXT_PUBLIC_DEV_MODE);
  console.log('DevTierSwitcher - process.env.NEXT_PUBLIC_DEV_ENABLE_TIER_SWITCHER:', process.env.NEXT_PUBLIC_DEV_ENABLE_TIER_SWITCHER);
  console.log('DevTierSwitcher - currentTier:', currentTier);
  console.log('DevTierSwitcher - accountId:', accountId);

  // Only show in development with tier switcher enabled
  if (!shouldEnableTierSwitcher()) {
    console.log('DevTierSwitcher - not showing due to shouldEnableTierSwitcher() = false');
    return null;
  }

  const handleTierChange = async (newTier: 'free' | 'pro' | 'premium') => {
    if (newTier === currentTier) return;

    setIsChanging(true);
    setMessage('');
    try {
      const response = await fetch('/api/dev/switch-tier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          tier: newTier
        })
      });

      if (!response.ok) {
        throw new Error('Failed to switch tier');
      }

      setSelectedTier(newTier);
      onTierChange?.(newTier);
      setMessage(`Upgraded to ${newTier.toUpperCase()} successfully!`);
      
      // Reload page to reflect changes
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Failed to switch tier:', error);
      setMessage('Failed to switch tier. Please try again.');
    } finally {
      setIsChanging(false);
    }
  };

  const handleManualUpgrade = async () => {
    setIsChanging(true);
    setMessage('');
    try {
      const response = await fetch('/api/dev/upgrade-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade account');
      }

      setMessage('Account upgraded to Pro successfully!');
      
      // Reload page to reflect changes
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Failed to upgrade account:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsChanging(false);
    }
  };

  const handleManualDowngrade = async () => {
    setIsChanging(true);
    setMessage('');
    try {
      const response = await fetch('/api/dev/upgrade-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to downgrade account');
      }

      setMessage('Account downgraded to Free successfully!');
      
      // Reload page to reflect changes
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Failed to downgrade account:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">DEV</Badge>
        <span className="text-sm font-medium">Tier Switcher</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Current:</span>
        <Badge variant={currentTier === 'premium' ? 'default' : currentTier === 'pro' ? 'secondary' : 'outline'}>
          {currentTier.toUpperCase()}
        </Badge>
      </div>

      <div className="space-y-2">
        <Select
          value={selectedTier}
          onValueChange={(value) => setSelectedTier(value as 'free' | 'pro' | 'premium')}
          disabled={isChanging}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free (3 decks)</SelectItem>
            <SelectItem value="pro">Pro (25 decks)</SelectItem>
            <SelectItem value="premium">Premium (unlimited)</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={() => handleTierChange(selectedTier)}
          disabled={isChanging || selectedTier === currentTier}
          size="sm"
          className="w-full"
        >
          {isChanging ? 'Switching...' : 'Switch Tier'}
        </Button>
      </div>

      {/* Manual Stripe Test Buttons */}
      <div className="border-t pt-3 space-y-2">
        <div className="text-xs text-gray-500 font-medium">Stripe Testing:</div>
        <div className="flex gap-2">
          <Button
            onClick={handleManualUpgrade}
            disabled={isChanging}
            size="sm"
            variant="default"
            className="flex-1 text-xs"
          >
            {isChanging ? '...' : '→ Pro'}
          </Button>
          <Button
            onClick={handleManualDowngrade}
            disabled={isChanging}
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
          >
            {isChanging ? '...' : '→ Free'}
          </Button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`text-xs p-2 rounded ${
          message.includes('Error') 
            ? 'bg-red-50 text-red-600' 
            : 'bg-green-50 text-green-600'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}