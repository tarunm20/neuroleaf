'use client';

import React, { useMemo } from 'react';
import { CheckSquare, HelpCircle, MessageSquare } from 'lucide-react';
import { Slider } from '@kit/ui/slider';
import { Label } from '@kit/ui/label';
import { Badge } from '@kit/ui/badge';

interface QuestionDistribution {
  multipleChoice: number;
  trueFalse: number;
  openEnded: number;
}

interface InteractivePieChartProps {
  totalQuestions: number;
  distribution: QuestionDistribution;
  onChange: (distribution: QuestionDistribution) => void;
  className?: string;
}

interface PieSegment {
  type: 'multipleChoice' | 'trueFalse' | 'openEnded';
  count: number;
  percentage: number;
  color: string;
  label: string;
  icon: React.ComponentType<{ className?: string; }>;
  startAngle: number;
  endAngle: number;
}

export function InteractivePieChart({ 
  totalQuestions, 
  distribution, 
  onChange, 
  className = '' 
}: InteractivePieChartProps) {

  // Calculate segments
  const segments: PieSegment[] = useMemo(() => {
    const total = distribution.multipleChoice + distribution.trueFalse + distribution.openEnded;
    
    if (total === 0) {
      return [];
    }

    const data = [
      {
        type: 'multipleChoice' as const,
        count: distribution.multipleChoice,
        percentage: (distribution.multipleChoice / total) * 100,
        color: '#3b82f6', // blue-500
        label: 'Multiple Choice',
        icon: CheckSquare,
      },
      {
        type: 'trueFalse' as const,
        count: distribution.trueFalse,
        percentage: (distribution.trueFalse / total) * 100,
        color: '#10b981', // green-500
        label: 'True/False',
        icon: HelpCircle,
      },
      {
        type: 'openEnded' as const,
        count: distribution.openEnded,
        percentage: (distribution.openEnded / total) * 100,
        color: '#8b5cf6', // purple-500
        label: 'Open Ended',
        icon: MessageSquare,
      },
    ];

    // Calculate angles only for segments with count > 0
    const activeSegments = data.filter(segment => segment.count > 0);
    let currentAngle = -90; // Start from top
    
    return data.map(segment => {
      if (segment.count === 0) {
        return {
          ...segment,
          startAngle: 0,
          endAngle: 0,
        };
      }
      
      // Recalculate percentage based on active segments only
      const activeTotal = activeSegments.reduce((sum, s) => sum + s.count, 0);
      const adjustedPercentage = activeTotal > 0 ? (segment.count / activeTotal) * 100 : 0;
      const angleSpan = (adjustedPercentage / 100) * 360;
      
      const result = {
        ...segment,
        percentage: adjustedPercentage,
        startAngle: currentAngle,
        endAngle: currentAngle + angleSpan,
      };
      currentAngle += angleSpan;
      return result;
    });
  }, [distribution]);

  // SVG dimensions
  const size = 160;
  const center = size / 2;
  const radius = 60;
  const innerRadius = 20;

  // Create SVG path for pie segment
  const createArcPath = (startAngle: number, endAngle: number, outerRadius: number, innerRadius: number = 0) => {
    // Handle full circle case (360 degrees) - SVG arcs can't handle full circles in one path
    const angleDiff = endAngle - startAngle;
    if (Math.abs(angleDiff) >= 360 || Math.abs(angleDiff) < 0.1) {
      // Create two half-circles for a full circle
      const midAngle = startAngle + 180;
      const start1 = polarToCartesian(center, center, outerRadius, startAngle);
      const mid1 = polarToCartesian(center, center, outerRadius, midAngle);
      const end1 = polarToCartesian(center, center, outerRadius, startAngle);
      
      if (innerRadius === 0) {
        // Full circle without hole
        return [
          "M", center, center,
          "L", start1.x, start1.y,
          "A", outerRadius, outerRadius, 0, 0, 1, mid1.x, mid1.y,
          "A", outerRadius, outerRadius, 0, 0, 1, start1.x, start1.y,
          "Z"
        ].join(" ");
      } else {
        // Full circle with hole (donut)
        const innerStart = polarToCartesian(center, center, innerRadius, startAngle);
        const innerMid = polarToCartesian(center, center, innerRadius, midAngle);
        
        return [
          "M", start1.x, start1.y,
          "A", outerRadius, outerRadius, 0, 0, 1, mid1.x, mid1.y,
          "A", outerRadius, outerRadius, 0, 0, 1, start1.x, start1.y,
          "L", innerStart.x, innerStart.y,
          "A", innerRadius, innerRadius, 0, 0, 0, innerMid.x, innerMid.y,
          "A", innerRadius, innerRadius, 0, 0, 0, innerStart.x, innerStart.y,
          "Z"
        ].join(" ");
      }
    }

    // Regular arc path for partial circles
    const start = polarToCartesian(center, center, outerRadius, endAngle);
    const end = polarToCartesian(center, center, outerRadius, startAngle);
    const innerStart = polarToCartesian(center, center, innerRadius, endAngle);
    const innerEnd = polarToCartesian(center, center, innerRadius, startAngle);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    if (innerRadius === 0) {
      return [
        "M", center, center,
        "L", start.x, start.y,
        "A", outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
        "Z"
      ].join(" ");
    } else {
      return [
        "M", start.x, start.y,
        "A", outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
        "L", innerEnd.x, innerEnd.y,
        "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
        "Z"
      ].join(" ");
    }
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  // Handle slider changes
  const handleSliderChange = (type: keyof QuestionDistribution, newValue: number) => {
    const newDistribution = { ...distribution };
    const oldValue = distribution[type];
    const _difference = newValue - oldValue;
    
    // Update the changed value
    newDistribution[type] = newValue;
    
    // Calculate total of other types
    const otherTypes = Object.keys(distribution).filter(key => key !== type) as (keyof QuestionDistribution)[];
    const currentOtherTotal = otherTypes.reduce((sum, key) => sum + distribution[key], 0);
    const newOtherTotal = totalQuestions - newValue;
    
    // If there's a difference, redistribute among other types
    if (currentOtherTotal > 0 && newOtherTotal >= 0) {
      const adjustmentRatio = newOtherTotal / currentOtherTotal;
      otherTypes.forEach(key => {
        newDistribution[key] = Math.round(distribution[key] * adjustmentRatio);
      });
      
      // Ensure total equals totalQuestions
      const actualTotal = newDistribution.multipleChoice + newDistribution.trueFalse + newDistribution.openEnded;
      const finalDifference = totalQuestions - actualTotal;
      
      if (finalDifference !== 0 && otherTypes.length > 0) {
        // Adjust the first available other type to match total
        const firstOther = otherTypes[0];
        if (firstOther) {
          newDistribution[firstOther] = Math.max(0, newDistribution[firstOther] + finalDifference);
        }
      }
    }
    
    onChange(newDistribution);
  };

  const activeSegments = segments.filter(segment => segment.count > 0);
  
  if (activeSegments.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center text-muted-foreground">
          <p>Select question types to see distribution</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center space-y-6 ${className}`}>
      {/* Pie Chart */}
      <div className="relative">
        <svg 
          width={size} 
          height={size} 
          className="transform transition-transform"
        >
          {activeSegments.map((segment) => (
            <g key={segment.type}>
              {/* Main segment */}
              <path
                d={createArcPath(segment.startAngle, segment.endAngle, radius, innerRadius)}
                fill={segment.color}
                stroke="white"
                strokeWidth="2"
                className="transition-all duration-200"
              />
              
              {/* Segment label */}
              {segment.percentage > 15 && (
                <text
                  x={polarToCartesian(center, center, (radius + innerRadius) / 2, (segment.startAngle + segment.endAngle) / 2).x}
                  y={polarToCartesian(center, center, (radius + innerRadius) / 2, (segment.startAngle + segment.endAngle) / 2).y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white text-xs font-medium pointer-events-none"
                >
                  {segment.count}
                </text>
              )}
            </g>
          ))}
          
          {/* Center circle */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius - 2}
            fill="white"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          
          {/* Center text */}
          <text
            x={center}
            y={center - 4}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-600 text-xs font-medium"
          >
            Total
          </text>
          <text
            x={center}
            y={center + 8}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-800 text-sm font-bold"
          >
            {totalQuestions}
          </text>
        </svg>
      </div>

      {/* Sliders for each question type */}
      <div className="space-y-4 w-full max-w-sm">
        {/* Multiple Choice Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
              <CheckSquare className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-medium">Multiple Choice</Label>
            </div>
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {distribution.multipleChoice}
            </Badge>
          </div>
          <Slider
            value={[distribution.multipleChoice]}
            onValueChange={(value) => handleSliderChange('multipleChoice', value[0] || 0)}
            max={totalQuestions}
            min={0}
            step={1}
            className="py-2"
          />
        </div>

        {/* True/False Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }} />
              <HelpCircle className="h-4 w-4 text-green-600" />
              <Label className="text-sm font-medium">True/False</Label>
            </div>
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {distribution.trueFalse}
            </Badge>
          </div>
          <Slider
            value={[distribution.trueFalse]}
            onValueChange={(value) => handleSliderChange('trueFalse', value[0] || 0)}
            max={totalQuestions}
            min={0}
            step={1}
            className="py-2"
          />
        </div>

        {/* Open Ended Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
              <MessageSquare className="h-4 w-4 text-purple-600" />
              <Label className="text-sm font-medium">Open Ended</Label>
            </div>
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {distribution.openEnded}
            </Badge>
          </div>
          <Slider
            value={[distribution.openEnded]}
            onValueChange={(value) => handleSliderChange('openEnded', value[0] || 0)}
            max={totalQuestions}
            min={0}
            step={1}
            className="py-2"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Adjust sliders to change question distribution
        </p>
      </div>
    </div>
  );
}