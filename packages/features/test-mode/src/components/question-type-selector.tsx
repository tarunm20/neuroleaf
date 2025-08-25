'use client';

import React, { useMemo } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import { Label } from '@kit/ui/label';
import { Checkbox } from '@kit/ui/checkbox';
import { Slider } from '@kit/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@kit/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { 
  CheckSquare, 
  HelpCircle, 
  MessageSquare, 
  Settings,
  PieChart 
} from 'lucide-react';

// Validation schema
const TestConfigurationSchema = z.object({
  totalQuestions: z.number().min(5).max(20),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  enableMultipleChoice: z.boolean(),
  enableTrueFalse: z.boolean(), 
  enableOpenEnded: z.boolean(),
  multipleChoiceCount: z.number().min(0).max(20),
  trueFalseCount: z.number().min(0).max(20),
  openEndedCount: z.number().min(0).max(20),
}).refine((data) => {
  // At least one question type must be enabled
  return data.enableMultipleChoice || data.enableTrueFalse || data.enableOpenEnded;
}, {
  message: "At least one question type must be enabled",
}).refine((data) => {
  // Total questions must match sum of individual counts when types are enabled
  const sum = (data.enableMultipleChoice ? data.multipleChoiceCount : 0) +
               (data.enableTrueFalse ? data.trueFalseCount : 0) +
               (data.enableOpenEnded ? data.openEndedCount : 0);
  return sum === data.totalQuestions;
}, {
  message: "Question counts must match total questions",
});

export type TestConfiguration = z.infer<typeof TestConfigurationSchema>;

interface QuestionTypeSelectorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (config: TestConfiguration) => void;
  maxQuestions?: number;
  defaultConfig?: Partial<TestConfiguration>;
}

export function QuestionTypeSelector({
  isOpen,
  onOpenChange,
  onConfirm,
  maxQuestions = 20,
  defaultConfig = {}
}: QuestionTypeSelectorProps) {
  // Acknowledge unused parameter
  void maxQuestions;
  const form = useForm<TestConfiguration>({
    resolver: zodResolver(TestConfigurationSchema),
    defaultValues: {
      totalQuestions: 10,
      difficulty: 'medium',
      enableMultipleChoice: true,
      enableTrueFalse: true,
      enableOpenEnded: true,
      multipleChoiceCount: 4,
      trueFalseCount: 3,
      openEndedCount: 3,
      ...defaultConfig,
    },
  });

  const watchedValues = form.watch();
  
  // Auto-distribute questions based on enabled types and total
  const updateQuestionDistribution = (totalQuestions: number, enabledTypes: string[]) => {
    if (enabledTypes.length === 0) return;
    
    const baseCount = Math.floor(totalQuestions / enabledTypes.length);
    const remainder = totalQuestions % enabledTypes.length;
    
    let mcCount = 0;
    let tfCount = 0;
    let oeCount = 0;
    
    if (enabledTypes.includes('multiple_choice')) {
      mcCount = baseCount + (remainder > 0 ? 1 : 0);
    }
    if (enabledTypes.includes('true_false')) {
      tfCount = baseCount + (remainder > 1 ? 1 : 0);
    }
    if (enabledTypes.includes('open_ended')) {
      oeCount = baseCount + (remainder > 2 ? 1 : 0);
    }
    
    // Adjust for any rounding issues
    const currentTotal = mcCount + tfCount + oeCount;
    if (currentTotal < totalQuestions) {
      if (enabledTypes.includes('multiple_choice')) mcCount++;
      else if (enabledTypes.includes('true_false')) tfCount++;
      else if (enabledTypes.includes('open_ended')) oeCount++;
    }
    
    form.setValue('multipleChoiceCount', mcCount);
    form.setValue('trueFalseCount', tfCount);
    form.setValue('openEndedCount', oeCount);
  };

  // Handle total questions change
  const handleTotalQuestionsChange = (value: number[]) => {
    const newTotal = value[0] || 10;
    form.setValue('totalQuestions', newTotal);
    
    const enabledTypes = [];
    if (watchedValues.enableMultipleChoice) enabledTypes.push('multiple_choice');
    if (watchedValues.enableTrueFalse) enabledTypes.push('true_false');
    if (watchedValues.enableOpenEnded) enabledTypes.push('open_ended');
    
    updateQuestionDistribution(newTotal, enabledTypes);
  };

  // Handle question type toggle
  const handleQuestionTypeToggle = (type: 'multiple_choice' | 'true_false' | 'open_ended', enabled: boolean) => {
    if (type === 'multiple_choice') form.setValue('enableMultipleChoice', enabled);
    else if (type === 'true_false') form.setValue('enableTrueFalse', enabled);
    else if (type === 'open_ended') form.setValue('enableOpenEnded', enabled);
    
    const enabledTypes = [];
    if (type === 'multiple_choice' && enabled) enabledTypes.push('multiple_choice');
    else if (watchedValues.enableMultipleChoice) enabledTypes.push('multiple_choice');
    
    if (type === 'true_false' && enabled) enabledTypes.push('true_false');
    else if (watchedValues.enableTrueFalse) enabledTypes.push('true_false');
    
    if (type === 'open_ended' && enabled) enabledTypes.push('open_ended');
    else if (watchedValues.enableOpenEnded) enabledTypes.push('open_ended');
    
    if (enabledTypes.length > 0) {
      updateQuestionDistribution(watchedValues.totalQuestions, enabledTypes);
    }
  };

  const isValid = useMemo(() => {
    const hasEnabledType = watchedValues.enableMultipleChoice || 
                          watchedValues.enableTrueFalse || 
                          watchedValues.enableOpenEnded;
    
    const totalMatches = (watchedValues.enableMultipleChoice ? watchedValues.multipleChoiceCount : 0) +
                        (watchedValues.enableTrueFalse ? watchedValues.trueFalseCount : 0) +
                        (watchedValues.enableOpenEnded ? watchedValues.openEndedCount : 0) === 
                        watchedValues.totalQuestions;
    
    return hasEnabledType && totalMatches;
  }, [watchedValues]);

  const handleSubmit = (data: TestConfiguration) => {
    if (isValid) {
      onConfirm(data);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure Your Test
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Quick Presets */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Quick Start Presets</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-auto p-3 flex-col gap-2"
                onClick={() => {
                  form.setValue('totalQuestions', 5);
                  form.setValue('enableMultipleChoice', true);
                  form.setValue('enableTrueFalse', true);
                  form.setValue('enableOpenEnded', false);
                  form.setValue('multipleChoiceCount', 3);
                  form.setValue('trueFalseCount', 2);
                  form.setValue('openEndedCount', 0);
                }}
              >
                <div className="text-lg font-semibold">Short</div>
                <div className="text-xs text-muted-foreground">5 Questions</div>
                <div className="text-xs text-muted-foreground">~3 min</div>
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="h-auto p-3 flex-col gap-2"
                onClick={() => {
                  form.setValue('totalQuestions', 10);
                  form.setValue('enableMultipleChoice', true);
                  form.setValue('enableTrueFalse', true);
                  form.setValue('enableOpenEnded', true);
                  form.setValue('multipleChoiceCount', 4);
                  form.setValue('trueFalseCount', 3);
                  form.setValue('openEndedCount', 3);
                }}
              >
                <div className="text-lg font-semibold">Medium</div>
                <div className="text-xs text-muted-foreground">10 Questions</div>
                <div className="text-xs text-muted-foreground">~6 min</div>
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="h-auto p-3 flex-col gap-2"
                onClick={() => {
                  form.setValue('totalQuestions', 20);
                  form.setValue('enableMultipleChoice', true);
                  form.setValue('enableTrueFalse', true);
                  form.setValue('enableOpenEnded', true);
                  form.setValue('multipleChoiceCount', 8);
                  form.setValue('trueFalseCount', 6);
                  form.setValue('openEndedCount', 6);
                }}
              >
                <div className="text-lg font-semibold">Long</div>
                <div className="text-xs text-muted-foreground">20 Questions</div>
                <div className="text-xs text-muted-foreground">~12 min</div>
              </Button>
            </div>
          </div>

          {/* Advanced Configuration */}
          <div className="border-t pt-6">
            <Label className="text-base font-medium mb-4 block">Advanced Configuration</Label>
          
          {/* Total Questions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Total Questions</Label>
              <Badge variant="outline">{watchedValues.totalQuestions}</Badge>
            </div>
            <Slider
              value={[watchedValues.totalQuestions]}
              onValueChange={handleTotalQuestionsChange}
              max={maxQuestions}
              min={5}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5</span>
              <span>{maxQuestions}</span>
            </div>
          </div>

          {/* Difficulty Level */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Difficulty Level</Label>
            <Select
              value={watchedValues.difficulty}
              onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                form.setValue('difficulty', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy - Basic recall</SelectItem>
                <SelectItem value="medium">Medium - Understanding & application</SelectItem>
                <SelectItem value="hard">Hard - Analysis & critical thinking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Question Types */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Question Types</Label>
            
            {/* Multiple Choice */}
            <Card className={watchedValues.enableMultipleChoice ? "ring-1 ring-primary/20" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={watchedValues.enableMultipleChoice}
                      onCheckedChange={(checked) => 
                        handleQuestionTypeToggle('multiple_choice', !!checked)
                      }
                    />
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                      <CardTitle className="text-sm">Multiple Choice</CardTitle>
                    </div>
                  </div>
                  {watchedValues.enableMultipleChoice && (
                    <Badge className="bg-blue-100 text-blue-800">
                      {watchedValues.multipleChoiceCount} questions
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  4 options with one correct answer. Great for testing specific knowledge.
                </p>
              </CardContent>
            </Card>

            {/* True/False */}
            <Card className={watchedValues.enableTrueFalse ? "ring-1 ring-primary/20" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={watchedValues.enableTrueFalse}
                      onCheckedChange={(checked) => 
                        handleQuestionTypeToggle('true_false', !!checked)
                      }
                    />
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-green-600" />
                      <CardTitle className="text-sm">True/False</CardTitle>
                    </div>
                  </div>
                  {watchedValues.enableTrueFalse && (
                    <Badge className="bg-green-100 text-green-800">
                      {watchedValues.trueFalseCount} questions
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Simple true or false statements. Perfect for fact verification.
                </p>
              </CardContent>
            </Card>

            {/* Open Ended */}
            <Card className={watchedValues.enableOpenEnded ? "ring-1 ring-primary/20" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={watchedValues.enableOpenEnded}
                      onCheckedChange={(checked) => 
                        handleQuestionTypeToggle('open_ended', !!checked)
                      }
                    />
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-600" />
                      <CardTitle className="text-sm">Open Ended</CardTitle>
                    </div>
                  </div>
                  {watchedValues.enableOpenEnded && (
                    <Badge className="bg-purple-100 text-purple-800">
                      {watchedValues.openEndedCount} questions
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Free-form text responses. Best for testing deep understanding.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Test Preview */}
          {isValid && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Test Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {watchedValues.enableMultipleChoice ? watchedValues.multipleChoiceCount : 0}
                    </div>
                    <div className="text-muted-foreground">MCQ</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {watchedValues.enableTrueFalse ? watchedValues.trueFalseCount : 0}
                    </div>
                    <div className="text-muted-foreground">T/F</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">
                      {watchedValues.enableOpenEnded ? watchedValues.openEndedCount : 0}
                    </div>
                    <div className="text-muted-foreground">Open</div>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <Badge variant="secondary" className="px-3 py-1">
                    {watchedValues.totalQuestions} Total Questions • {watchedValues.difficulty.charAt(0).toUpperCase() + watchedValues.difficulty.slice(1)} Difficulty
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {form.formState.errors.root && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
              {form.formState.errors.root.message}
            </div>
          )}
          </div>
        </form>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => form.handleSubmit(handleSubmit)()}
            disabled={!isValid}
          >
            Generate Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}