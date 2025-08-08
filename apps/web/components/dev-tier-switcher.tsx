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
      
      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch tier:', error);
      alert('Failed to switch tier. Please try again.');
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
    </div>
  );
}