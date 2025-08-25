'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Label } from '@kit/ui/label';
import { Slider } from '@kit/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';
import { InteractivePieChart } from './interactive-pie-chart';
import { 
  Clock, 
  Zap, 
  Target,
  CheckSquare, 
  HelpCircle, 
  MessageSquare,
  Sparkles,
  BarChart3
} from 'lucide-react';

// Test preset configurations
const TEST_PRESETS = [
  {
    id: 'quick',
    name: 'Quick Review',
    description: 'Perfect for a fast knowledge check',
    totalQuestions: 5,
    estimatedTime: '3 min',
    difficulty: 'easy' as const,
    enableMultipleChoice: true,
    enableTrueFalse: true,
    enableOpenEnded: false,
    multipleChoiceCount: 3,
    trueFalseCount: 2,
    openEndedCount: 0,
    icon: Zap,
    color: 'emerald',
    popular: false,
  },
  {
    id: 'focused',
    name: 'Focused Study',
    description: 'Balanced test for thorough review',
    totalQuestions: 10,
    estimatedTime: '6 min',
    difficulty: 'medium' as const,
    enableMultipleChoice: true,
    enableTrueFalse: true,
    enableOpenEnded: true,
    multipleChoiceCount: 4,
    trueFalseCount: 3,
    openEndedCount: 3,
    icon: Target,
    color: 'blue',
    popular: true,
  },
  {
    id: 'comprehensive',
    name: 'Deep Assessment',
    description: 'Complete evaluation of knowledge',
    totalQuestions: 20,
    estimatedTime: '15 min',
    difficulty: 'hard' as const,
    enableMultipleChoice: true,
    enableTrueFalse: true,
    enableOpenEnded: true,
    multipleChoiceCount: 8,
    trueFalseCount: 6,
    openEndedCount: 6,
    icon: BarChart3,
    color: 'purple',
    popular: false,
  },
];

// Validation schema (same as before)
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
  return data.enableMultipleChoice || data.enableTrueFalse || data.enableOpenEnded;
}, {
  message: "At least one question type must be enabled",
}).refine((data) => {
  const sum = (data.enableMultipleChoice ? data.multipleChoiceCount : 0) +
               (data.enableTrueFalse ? data.trueFalseCount : 0) +
               (data.enableOpenEnded ? data.openEndedCount : 0);
  return sum === data.totalQuestions;
}, {
  message: "Question counts must match total questions",
});

export type TestConfiguration = z.infer<typeof TestConfigurationSchema>;

interface ModernTestConfiguratorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (config: TestConfiguration) => void;
  maxQuestions?: number;
  defaultConfig?: Partial<TestConfiguration>;
}

export function ModernTestConfigurator({
  isOpen,
  onOpenChange,
  onConfirm,
  maxQuestions = 20,
  defaultConfig = {}
}: ModernTestConfiguratorProps) {
  // Acknowledge unused parameter
  void maxQuestions;

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);
  
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

  // Handle preset selection
  const handlePresetSelect = (presetId: string) => {
    const preset = TEST_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      form.setValue('totalQuestions', preset.totalQuestions);
      form.setValue('difficulty', preset.difficulty);
      form.setValue('enableMultipleChoice', preset.enableMultipleChoice);
      form.setValue('enableTrueFalse', preset.enableTrueFalse);
      form.setValue('enableOpenEnded', preset.enableOpenEnded);
      form.setValue('multipleChoiceCount', preset.multipleChoiceCount);
      form.setValue('trueFalseCount', preset.trueFalseCount);
      form.setValue('openEndedCount', preset.openEndedCount);
    }
  };

  // Handle direct preset generation
  const handlePresetGenerate = (presetId: string) => {
    handlePresetSelect(presetId);
    // Wait for form to update, then submit
    setTimeout(() => {
      const data = form.getValues();
      onConfirm(data);
      onOpenChange(false);
    }, 0);
  };

  // Handle preset customization
  const handlePresetCustomize = (presetId: string) => {
    handlePresetSelect(presetId);
    setShowCustomization(true);
  };

  // Auto-distribute questions when changing counts
  const updateQuestionDistribution = () => {
    const enabledTypes = [];
    if (watchedValues.enableMultipleChoice) enabledTypes.push('mc');
    if (watchedValues.enableTrueFalse) enabledTypes.push('tf');
    if (watchedValues.enableOpenEnded) enabledTypes.push('oe');

    if (enabledTypes.length === 0) return;

    const baseCount = Math.floor(watchedValues.totalQuestions / enabledTypes.length);
    const remainder = watchedValues.totalQuestions % enabledTypes.length;

    let mcCount = 0, tfCount = 0, oeCount = 0;

    if (enabledTypes.includes('mc')) {
      mcCount = baseCount + (remainder > 0 ? 1 : 0);
    }
    if (enabledTypes.includes('tf')) {
      tfCount = baseCount + (remainder > 1 ? 1 : 0);
    }
    if (enabledTypes.includes('oe')) {
      oeCount = baseCount + (remainder > 2 ? 1 : 0);
    }

    form.setValue('multipleChoiceCount', mcCount);
    form.setValue('trueFalseCount', tfCount);
    form.setValue('openEndedCount', oeCount);
  };

  const handleSubmit = () => {
    const data = form.getValues();
    onConfirm(data);
    onOpenChange(false);
  };


  const getColorClasses = (color: string) => {
    const colors = {
      emerald: 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900',
      blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900',
      purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Configure Your Test</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!showCustomization ? (
            // Preset Selection View
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium">Choose Your Test Type</h3>
                <p className="text-muted-foreground">Select a preset or create a custom test</p>
              </div>

              <div className="grid gap-4">
                {TEST_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedPreset === preset.id;
                  
                  return (
                    <Card 
                      key={preset.id}
                      className={`transition-all duration-200 ${
                        isSelected 
                          ? 'ring-2 ring-primary shadow-md' 
                          : 'hover:shadow-md hover:border-primary/20'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${getColorClasses(preset.color)}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{preset.name}</h4>
                                {preset.popular && (
                                  <Badge className="bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Popular
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{preset.description}</p>
                              <div className="space-y-2">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {preset.estimatedTime}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">{preset.totalQuestions}</span>
                                    questions
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {preset.difficulty}
                                  </Badge>
                                </div>
                                
                                {/* Question Breakdown */}
                                <div className="flex items-center gap-3 text-xs">
                                  {preset.multipleChoiceCount > 0 && (
                                    <div className="flex items-center gap-1 text-blue-600">
                                      <CheckSquare className="h-3 w-3" />
                                      <span className="font-medium">{preset.multipleChoiceCount}</span>
                                      <span className="text-muted-foreground">MCQ</span>
                                    </div>
                                  )}
                                  {preset.trueFalseCount > 0 && (
                                    <div className="flex items-center gap-1 text-green-600">
                                      <HelpCircle className="h-3 w-3" />
                                      <span className="font-medium">{preset.trueFalseCount}</span>
                                      <span className="text-muted-foreground">T/F</span>
                                    </div>
                                  )}
                                  {preset.openEndedCount > 0 && (
                                    <div className="flex items-center gap-1 text-purple-600">
                                      <MessageSquare className="h-3 w-3" />
                                      <span className="font-medium">{preset.openEndedCount}</span>
                                      <span className="text-muted-foreground">Open</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 min-w-max">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePresetGenerate(preset.id);
                              }}
                              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-3 py-1.5"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              Generate Now
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePresetCustomize(preset.id);
                              }}
                              className="text-xs px-3 py-1.5"
                            >
                              Customize
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPreset('custom');
                    setShowCustomization(true);
                  }}
                >
                  Create Custom Test
                </Button>
              </div>
            </div>
          ) : (
            // Customization View
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Customize Your Test</h3>
                  <p className="text-muted-foreground">Adjust the distribution and settings</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCustomization(false)}
                >
                  Back to Presets
                </Button>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Left Column - Pie Chart */}
                <div className="space-y-4">
                  <div className="text-center">
                    <Label className="text-base font-medium">Question Distribution</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use sliders to adjust
                    </p>
                  </div>
                  
                  <InteractivePieChart
                    totalQuestions={watchedValues.totalQuestions}
                    distribution={{
                      multipleChoice: watchedValues.multipleChoiceCount,
                      trueFalse: watchedValues.trueFalseCount,
                      openEnded: watchedValues.openEndedCount,
                    }}
                    onChange={(distribution) => {
                      form.setValue('multipleChoiceCount', distribution.multipleChoice);
                      form.setValue('trueFalseCount', distribution.trueFalse);
                      form.setValue('openEndedCount', distribution.openEnded);
                      form.setValue('enableMultipleChoice', distribution.multipleChoice > 0);
                      form.setValue('enableTrueFalse', distribution.trueFalse > 0);
                      form.setValue('enableOpenEnded', distribution.openEnded > 0);
                    }}
                  />

                  {/* Quick Distribution Presets */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Quick Adjustments</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const total = watchedValues.totalQuestions;
                          const mcCount = Math.floor(total * 0.6);
                          const tfCount = Math.floor(total * 0.4);
                          const oeCount = total - mcCount - tfCount;
                          
                          form.setValue('multipleChoiceCount', mcCount);
                          form.setValue('trueFalseCount', tfCount);
                          form.setValue('openEndedCount', oeCount);
                          form.setValue('enableMultipleChoice', mcCount > 0);
                          form.setValue('enableTrueFalse', tfCount > 0);
                          form.setValue('enableOpenEnded', oeCount > 0);
                        }}
                        className="text-xs"
                      >
                        More MCQ
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const total = watchedValues.totalQuestions;
                          const count = Math.floor(total / 3);
                          const remainder = total % 3;
                          
                          form.setValue('multipleChoiceCount', count + (remainder > 0 ? 1 : 0));
                          form.setValue('trueFalseCount', count + (remainder > 1 ? 1 : 0));
                          form.setValue('openEndedCount', count);
                          form.setValue('enableMultipleChoice', true);
                          form.setValue('enableTrueFalse', true);
                          form.setValue('enableOpenEnded', true);
                        }}
                        className="text-xs"
                      >
                        Equal Split
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const total = watchedValues.totalQuestions;
                          form.setValue('multipleChoiceCount', 0);
                          form.setValue('trueFalseCount', 0);
                          form.setValue('openEndedCount', total);
                          form.setValue('enableMultipleChoice', false);
                          form.setValue('enableTrueFalse', false);
                          form.setValue('enableOpenEnded', true);
                        }}
                        className="text-xs"
                      >
                        Only Open
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const total = watchedValues.totalQuestions;
                          const mcCount = Math.floor(total * 0.5);
                          const tfCount = total - mcCount;
                          
                          form.setValue('multipleChoiceCount', mcCount);
                          form.setValue('trueFalseCount', tfCount);
                          form.setValue('openEndedCount', 0);
                          form.setValue('enableMultipleChoice', true);
                          form.setValue('enableTrueFalse', true);
                          form.setValue('enableOpenEnded', false);
                        }}
                        className="text-xs"
                      >
                        Quick Only
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Right Column - Controls */}
                <div className="space-y-6">
                  {/* Total Questions Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Total Questions</Label>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {watchedValues.totalQuestions}
                      </Badge>
                    </div>
                    <Slider
                      value={[watchedValues.totalQuestions]}
                      onValueChange={(value) => {
                        const newTotal = value[0] || 10;
                        form.setValue('totalQuestions', newTotal);
                        updateQuestionDistribution();
                      }}
                      max={20}
                      min={5}
                      step={1}
                      className="py-4"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>5</span>
                      <span>20</span>
                    </div>
                  </div>

                  {/* Difficulty Selector */}
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
                        <SelectItem value="easy">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span>Easy - Basic recall</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                            <span>Medium - Understanding & application</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="hard">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span>Hard - Analysis & critical thinking</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Configuration Summary */}
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        Configuration Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex items-center gap-4 text-sm">
                        <Badge className="bg-primary text-primary-foreground">
                          {watchedValues.totalQuestions} questions
                        </Badge>
                        <Badge variant="outline">
                          {watchedValues.difficulty}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        {watchedValues.multipleChoiceCount > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckSquare className="h-3 w-3 text-blue-500" />
                            {watchedValues.multipleChoiceCount} Multiple Choice
                          </div>
                        )}
                        {watchedValues.trueFalseCount > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <HelpCircle className="h-3 w-3 text-green-500" />
                            {watchedValues.trueFalseCount} True/False
                          </div>
                        )}
                        {watchedValues.openEndedCount > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <MessageSquare className="h-3 w-3 text-purple-500" />
                            {watchedValues.openEndedCount} Open Ended
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                        <Clock className="h-3 w-3" />
                        ~{Math.ceil(watchedValues.totalQuestions * 0.6)} min estimated
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div></div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              
              {showCustomization && (
                <Button onClick={handleSubmit}>
                  Generate Test
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}