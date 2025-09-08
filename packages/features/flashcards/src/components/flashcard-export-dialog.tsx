'use client';

import React, { useState } from 'react';
import { Button } from '@kit/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Switch } from '@kit/ui/switch';
import { Label } from '@kit/ui/label';
import { Separator } from '@kit/ui/separator';
import { toast } from 'sonner';
import { 
  Download, 
  FileText, 
  Table, 
  FileJson,
  Loader2 
} from 'lucide-react';
import { 
  flashcardExportService, 
  type ExportOptions,
  type Flashcard,
  type Deck
} from '../services/flashcard-export.service';

interface FlashcardExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deck: Deck;
  flashcards: Flashcard[];
}

export function FlashcardExportDialog({
  open,
  onOpenChange,
  deck,
  flashcards
}: FlashcardExportDialogProps) {
  const [format, setFormat] = useState<'pdf' | 'json' | 'csv'>('pdf');
  const [includeTags, setIncludeTags] = useState(true);
  const [includeDifficulty, setIncludeDifficulty] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [pageSize, setPageSize] = useState<'a4' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pdfLayout, setPdfLayout] = useState<'cards' | 'study-guide' | 'print-cards'>('cards');
  const [isExporting, setIsExporting] = useState(false);

  const formatIcons = {
    pdf: FileText,
    json: FileJson,
    csv: Table
  };

  const formatDescriptions = {
    pdf: 'Formatted document with flashcard content',
    json: 'Structured data format for backup and import',
    csv: 'Spreadsheet-compatible format'
  };

  const handleExport = async () => {
    if (flashcards.length === 0) {
      toast.error('No flashcards to export');
      return;
    }

    try {
      setIsExporting(true);
      
      const options: ExportOptions = {
        format,
        includeTags,
        includeDifficulty,
        includeMetadata,
        ...(format === 'pdf' && { pageSize, orientation, pdfLayout })
      };

      await flashcardExportService.exportFlashcards(deck, flashcards, options);
      
      toast.success(`Flashcards exported as ${format.toUpperCase()}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(
        error instanceof Error 
          ? `Export failed: ${error.message}`
          : 'Failed to export flashcards'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const FormatIcon = formatIcons[format];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Flashcards
          </DialogTitle>
          <DialogDescription>
            Export {flashcards.length} flashcards from &ldquo;{deck.name}&rdquo; in your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <Select value={format} onValueChange={(value: 'pdf' | 'json' | 'csv') => setFormat(value)}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <FormatIcon className="h-4 w-4" />
                    {format.toUpperCase()}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(formatDescriptions).map(([key, description]) => {
                  const Icon = formatIcons[key as keyof typeof formatIcons];
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{key.toUpperCase()}</div>
                          <div className="text-xs text-muted-foreground">{description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* PDF-specific options */}
          {format === 'pdf' && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label className="text-sm font-medium">PDF Layout & Style</Label>
                
                {/* Layout Selection */}
                <div>
                  <Label className="text-xs text-muted-foreground">Layout Style</Label>
                  <Select value={pdfLayout} onValueChange={(value: 'cards' | 'study-guide' | 'print-cards') => setPdfLayout(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cards">Card View - Clean flashcard format with Q&A layout</SelectItem>
                      <SelectItem value="study-guide">Study Guide - Compact question and answer list</SelectItem>
                      <SelectItem value="print-cards">Print Cards - 4x6 inch printable flashcards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Page Size</Label>
                    <Select value={pageSize} onValueChange={(value: 'a4' | 'letter') => setPageSize(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4</SelectItem>
                        <SelectItem value="letter">Letter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Orientation</Label>
                    <Select value={orientation} onValueChange={(value: 'portrait' | 'landscape') => setOrientation(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Content Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Include in Export</Label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="include-tags" className="text-sm">Tags</Label>
                <Switch 
                  id="include-tags"
                  checked={includeTags} 
                  onCheckedChange={setIncludeTags}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="include-difficulty" className="text-sm">Difficulty Level</Label>
                <Switch 
                  id="include-difficulty"
                  checked={includeDifficulty} 
                  onCheckedChange={setIncludeDifficulty}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="include-metadata" className="text-sm">Metadata (dates, AI-generated)</Label>
                <Switch 
                  id="include-metadata"
                  checked={includeMetadata} 
                  onCheckedChange={setIncludeMetadata}
                />
              </div>
            </div>
          </div>

          {/* Export Summary */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <div className="font-medium">Export Summary</div>
            <div className="text-muted-foreground space-y-1 mt-1">
              <div>• {flashcards.length} flashcards</div>
              <div>• Format: {format.toUpperCase()}</div>
              {format === 'pdf' && (
                <>
                  <div>• Layout: {pdfLayout === 'cards' ? 'Card View' : pdfLayout === 'study-guide' ? 'Study Guide' : 'Print Cards'}</div>
                  <div>• Page: {pageSize.toUpperCase()} {orientation}</div>
                  <div>• Style: Minimalistic</div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              className="flex-1"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}