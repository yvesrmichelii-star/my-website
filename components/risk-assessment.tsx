"use client";

import { useMemo, useState } from "react";
import { BookingRequest, ManagerCriteria } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calendar,
  MapPin,
  Music,
  FileText,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskAssessmentProps {
  requests: BookingRequest[];
  criteria: ManagerCriteria;
  onSelectRequest?: (request: BookingRequest) => void;
  selectedRequestId?: string | null;
}

interface RiskScore {
  request: BookingRequest;
  overallScore: number; // 0-100 where 100 = no risk
  factors: {
    feeScore: number;
    timingScore: number;
    eventTypeScore: number;
    locationScore: number;
    venueScore: number;
    notesScore: number;
  };
  riskLevel: "low" | "medium" | "high" | "critical";
  warnings: string[];
}

function calculateRiskScore(
  request: BookingRequest,
  criteria: ManagerCriteria
): RiskScore {
  const warnings: string[] = [];
  
  // 1. Fee Score (0-100)
  let feeScore = 100;
  const feeRatio = request.proposedFee / criteria.minimumFee;
  if (feeRatio < 0.5) {
    feeScore = 20;
    warnings.push("Fee is less than 50% of minimum");
  } else if (feeRatio < 0.8) {
    feeScore = 40;
    warnings.push("Fee is below minimum threshold");
  } else if (feeRatio < 1.0) {
    feeScore = 60;
    warnings.push("Fee is slightly below minimum");
  } else if (feeRatio < 1.5) {
    feeScore = 80;
  } else if (feeRatio >= 2.0) {
    feeScore = 100;
  } else {
    feeScore = 90;
  }

  // 2. Timing Score (0-100)
  let timingScore = 100;
  const eventDate = new Date(request.eventDate);
  const today = new Date();
  const daysUntilEvent = Math.ceil(
    (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysUntilEvent < 0) {
    timingScore = 0;
    warnings.push("Event date has passed");
  } else if (daysUntilEvent < criteria.minDaysInAdvance) {
    timingScore = 30;
    warnings.push("Too short notice for booking");
  } else if (daysUntilEvent < 14) {
    timingScore = 60;
    warnings.push("Limited time for preparation");
  } else if (daysUntilEvent > criteria.maxDaysInAdvance) {
    timingScore = 70;
    warnings.push("Event is far in advance");
  } else {
    timingScore = 100;
  }

  // 3. Event Type Score (0-100)
  let eventTypeScore = 100;
  if (!criteria.allowedEventTypes.includes(request.eventType)) {
    eventTypeScore = 20;
    warnings.push("Event type not in allowed list");
  } else if (criteria.preferredEventTypes.includes(request.eventType)) {
    eventTypeScore = 100;
  } else {
    eventTypeScore = 70;
  }

  // 4. Location Score (0-100)
  let locationScore = 100;
  const locationCity = request.eventLocation.split(",")[0].trim();
  
  if (criteria.blockedLocations.some(loc => 
    request.eventLocation.toLowerCase().includes(loc.toLowerCase())
  )) {
    locationScore = 0;
    warnings.push("Location is blocked");
  } else if (criteria.priorityLocations.some(loc => 
    request.eventLocation.toLowerCase().includes(loc.toLowerCase())
  )) {
    locationScore = 100;
  } else if (request.eventLocation.includes("UAE") || request.eventLocation.includes("Dubai")) {
    locationScore = 80; // International requires more logistics
    warnings.push("International location requires additional logistics");
  } else {
    locationScore = 70;
  }

  // 5. Venue Score (0-100) - based on venue name patterns
  let venueScore = 80;
  const venueLower = request.venueName.toLowerCase();
  if (venueLower.includes("private") || venueLower.includes("residence")) {
    venueScore = 60;
    warnings.push("Private venue - verify legitimacy");
  } else if (venueLower.includes("local") || venueLower.includes("unknown")) {
    venueScore = 50;
    warnings.push("Unknown venue reputation");
  } else if (
    venueLower.includes("arena") ||
    venueLower.includes("amphitheatre") ||
    venueLower.includes("nightclub")
  ) {
    venueScore = 100;
  }

  // 6. Notes Score (0-100) - analyze notes for red flags or positive signals
  let notesScore = 80;
  const notesLower = (request.notes || "").toLowerCase();
  
  if (notesLower.includes("negotiable") || notesLower.includes("limited budget")) {
    notesScore = 50;
    warnings.push("Budget concerns mentioned");
  }
  if (notesLower.includes("all expenses") || notesLower.includes("travel covered")) {
    notesScore = Math.min(notesScore + 20, 100);
  }
  if (notesLower.includes("recurring") || notesLower.includes("residency")) {
    notesScore = Math.min(notesScore + 15, 100);
  }
  if (notesLower.includes("vip") || notesLower.includes("high-profile")) {
    notesScore = Math.min(notesScore + 10, 100);
  }

  // Calculate overall score (weighted average)
  const weights = {
    fee: 0.30,
    timing: 0.20,
    eventType: 0.15,
    location: 0.15,
    venue: 0.10,
    notes: 0.10,
  };

  const overallScore = Math.round(
    feeScore * weights.fee +
    timingScore * weights.timing +
    eventTypeScore * weights.eventType +
    locationScore * weights.location +
    venueScore * weights.venue +
    notesScore * weights.notes
  );

  // Determine risk level
  let riskLevel: "low" | "medium" | "high" | "critical";
  if (overallScore >= 80) {
    riskLevel = "low";
  } else if (overallScore >= 60) {
    riskLevel = "medium";
  } else if (overallScore >= 40) {
    riskLevel = "high";
  } else {
    riskLevel = "critical";
  }

  return {
    request,
    overallScore,
    factors: {
      feeScore,
      timingScore,
      eventTypeScore,
      locationScore,
      venueScore,
      notesScore,
    },
    riskLevel,
    warnings,
  };
}

function getRiskColors(level: string) {
  switch (level) {
    case "low":
      return {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-600",
        progress: "bg-emerald-500",
      };
    case "medium":
      return {
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        text: "text-amber-600",
        progress: "bg-amber-500",
      };
    case "high":
      return {
        bg: "bg-orange-500/10",
        border: "border-orange-500/30",
        text: "text-orange-600",
        progress: "bg-orange-500",
      };
    case "critical":
      return {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        text: "text-red-600",
        progress: "bg-red-500",
      };
    default:
      return {
        bg: "bg-muted",
        border: "border-border",
        text: "text-muted-foreground",
        progress: "bg-muted-foreground",
      };
  }
}

function getRiskIcon(level: string) {
  switch (level) {
    case "low":
      return ShieldCheck;
    case "medium":
      return Shield;
    case "high":
      return ShieldAlert;
    case "critical":
      return ShieldX;
    default:
      return Shield;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function RiskAssessment({
  requests,
  criteria,
  onSelectRequest,
  selectedRequestId,
}: RiskAssessmentProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "fee" | "date">("score");

  const riskScores = useMemo(() => {
    const scores = requests.map((r) => calculateRiskScore(r, criteria));
    
    // Sort based on selected criteria
    return scores.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return a.overallScore - b.overallScore; // Lowest (riskiest) first
        case "fee":
          return b.request.proposedFee - a.request.proposedFee;
        case "date":
          return new Date(a.request.eventDate).getTime() - new Date(b.request.eventDate).getTime();
        default:
          return 0;
      }
    });
  }, [requests, criteria, sortBy]);

  const summary = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    riskScores.forEach((s) => counts[s.riskLevel]++);
    const avgScore = riskScores.length > 0
      ? Math.round(riskScores.reduce((sum, s) => sum + s.overallScore, 0) / riskScores.length)
      : 0;
    return { counts, avgScore };
  }, [riskScores]);

  return (
    <div className="flex h-full flex-col">
      {/* Summary Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Shield className="h-4 w-4" />
            Risk Assessment
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Avg Score:</span>
            <Badge 
              variant="outline" 
              className={cn(
                "font-mono",
                summary.avgScore >= 80 ? "border-emerald-500/50 text-emerald-600" :
                summary.avgScore >= 60 ? "border-amber-500/50 text-amber-600" :
                summary.avgScore >= 40 ? "border-orange-500/50 text-orange-600" :
                "border-red-500/50 text-red-600"
              )}
            >
              {summary.avgScore}%
            </Badge>
          </div>
        </div>

        {/* Risk Level Distribution */}
        <div className="mb-4 grid grid-cols-4 gap-2">
          <div className="rounded-lg bg-emerald-500/10 p-2 text-center">
            <div className="text-lg font-bold text-emerald-600">{summary.counts.low}</div>
            <div className="text-[10px] text-emerald-600/80">Low Risk</div>
          </div>
          <div className="rounded-lg bg-amber-500/10 p-2 text-center">
            <div className="text-lg font-bold text-amber-600">{summary.counts.medium}</div>
            <div className="text-[10px] text-amber-600/80">Medium</div>
          </div>
          <div className="rounded-lg bg-orange-500/10 p-2 text-center">
            <div className="text-lg font-bold text-orange-600">{summary.counts.high}</div>
            <div className="text-[10px] text-orange-600/80">High</div>
          </div>
          <div className="rounded-lg bg-red-500/10 p-2 text-center">
            <div className="text-lg font-bold text-red-600">{summary.counts.critical}</div>
            <div className="text-[10px] text-red-600/80">Critical</div>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex gap-1">
          <button
            onClick={() => setSortBy("score")}
            className={cn(
              "rounded-md px-2 py-1 text-xs transition-colors",
              sortBy === "score"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            By Risk
          </button>
          <button
            onClick={() => setSortBy("fee")}
            className={cn(
              "rounded-md px-2 py-1 text-xs transition-colors",
              sortBy === "fee"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            By Fee
          </button>
          <button
            onClick={() => setSortBy("date")}
            className={cn(
              "rounded-md px-2 py-1 text-xs transition-colors",
              sortBy === "date"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            By Date
          </button>
        </div>
      </div>

      {/* Risk Score List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {riskScores.map((score) => {
            const colors = getRiskColors(score.riskLevel);
            const Icon = getRiskIcon(score.riskLevel);
            const isExpanded = expandedId === score.request.id;
            const isSelected = selectedRequestId === score.request.id;

            return (
              <div
                key={score.request.id}
                className={cn(
                  "rounded-lg border transition-all",
                  colors.border,
                  isSelected ? colors.bg : "bg-card hover:bg-muted/50"
                )}
              >
                {/* Main Row */}
                <div
                  onClick={() => onSelectRequest?.(score.request)}
                  className="w-full p-3 text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("rounded-full p-1.5", colors.bg)}>
                        <Icon className={cn("h-4 w-4", colors.text)} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {score.request.venueName}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{score.request.eventLocation}</span>
                          <span>•</span>
                          <span>{formatCurrency(score.request.proposedFee)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={cn("text-lg font-bold", colors.text)}>
                          {score.overallScore}%
                        </div>
                        <div className="text-[10px] uppercase text-muted-foreground">
                          {score.riskLevel} risk
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(isExpanded ? null : score.request.id);
                        }}
                        className="rounded p-1 hover:bg-muted"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2">
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full transition-all", colors.progress)}
                        style={{ width: `${score.overallScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border px-3 pb-3 pt-2">
                    {/* Factor Breakdown */}
                    <div className="mb-3 space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        Risk Factor Breakdown
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FactorRow
                          icon={DollarSign}
                          label="Fee"
                          score={score.factors.feeScore}
                        />
                        <FactorRow
                          icon={Calendar}
                          label="Timing"
                          score={score.factors.timingScore}
                        />
                        <FactorRow
                          icon={Music}
                          label="Event Type"
                          score={score.factors.eventTypeScore}
                        />
                        <FactorRow
                          icon={MapPin}
                          label="Location"
                          score={score.factors.locationScore}
                        />
                        <FactorRow
                          icon={TrendingUp}
                          label="Venue"
                          score={score.factors.venueScore}
                        />
                        <FactorRow
                          icon={FileText}
                          label="Contract"
                          score={score.factors.notesScore}
                        />
                      </div>
                    </div>

                    {/* Warnings */}
                    {score.warnings.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">
                          Warnings
                        </div>
                        <div className="space-y-1">
                          {score.warnings.map((warning, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-1.5 text-xs"
                            >
                              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                              <span className="text-muted-foreground">{warning}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {riskScores.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No requests to assess
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function FactorRow({
  icon: Icon,
  label,
  score,
}: {
  icon: React.ElementType;
  label: string;
  score: number;
}) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-600";
    if (s >= 60) return "text-amber-600";
    if (s >= 40) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="flex items-center justify-between rounded-md bg-muted/50 px-2 py-1">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className={cn("text-xs font-medium", getScoreColor(score))}>
        {score}%
      </span>
    </div>
  );
}
