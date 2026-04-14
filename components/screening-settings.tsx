"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Settings2, DollarSign, Calendar, Music, MapPin, Sparkles, Zap, Flag, X } from "lucide-react";
import { ManagerCriteria, EventType } from "@/lib/types";

interface ScreeningSettingsProps {
  criteria: ManagerCriteria;
  onCriteriaChange: (criteria: ManagerCriteria) => void;
}

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "club", label: "Club" },
  { value: "festival", label: "Festival" },
  { value: "lounge", label: "Lounge" },
  { value: "private", label: "Private" },
  { value: "corporate", label: "Corporate" },
  { value: "concert", label: "Concert" },
];

export function ScreeningSettings({ criteria, onCriteriaChange }: ScreeningSettingsProps) {
  const [priorityInput, setPriorityInput] = useState("");
  const [blockedInput, setBlockedInput] = useState("");

  const updateCriteria = <K extends keyof ManagerCriteria>(key: K, value: ManagerCriteria[K]) => {
    onCriteriaChange({ ...criteria, [key]: value });
  };

  const toggleEventType = (type: EventType, field: "allowedEventTypes" | "preferredEventTypes") => {
    const current = criteria[field];
    if (current.includes(type)) {
      updateCriteria(field, current.filter((t) => t !== type));
    } else {
      updateCriteria(field, [...current, type]);
    }
  };

  const addLocation = (field: "priorityLocations" | "blockedLocations", value: string) => {
    if (value.trim() && !criteria[field].includes(value.trim())) {
      updateCriteria(field, [...criteria[field], value.trim()]);
    }
  };

  const removeLocation = (field: "priorityLocations" | "blockedLocations", value: string) => {
    updateCriteria(field, criteria[field].filter((loc) => loc !== value));
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Screening Criteria</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Screening Criteria</SheetTitle>
          <SheetDescription>
            Configure the 7 key criteria for evaluating booking requests.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Feature Toggles */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Processing Mode</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-destructive/10 p-2">
                    <Zap className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <Label htmlFor="auto-reject" className="cursor-pointer">Auto-Reject</Label>
                    <p className="text-xs text-muted-foreground">Automatically reject non-qualifying requests</p>
                  </div>
                </div>
                <Switch
                  id="auto-reject"
                  checked={criteria.autoRejectEnabled}
                  onCheckedChange={(v) => updateCriteria("autoRejectEnabled", v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-warning/10 p-2">
                    <Flag className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <Label htmlFor="manual-review" className="cursor-pointer">Manual Review Flagging</Label>
                    <p className="text-xs text-muted-foreground">Flag borderline cases for review</p>
                  </div>
                </div>
                <Switch
                  id="manual-review"
                  checked={criteria.manualReviewFlagging}
                  onCheckedChange={(v) => updateCriteria("manualReviewFlagging", v)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* 1. Minimum Fee */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">1. Minimum Booking Fee</h3>
            </div>
            <p className="text-xs text-muted-foreground">What is the minimum fee you will accept?</p>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                type="number"
                value={criteria.minimumFee}
                onChange={(e) => updateCriteria("minimumFee", parseInt(e.target.value) || 0)}
                className="w-32"
              />
            </div>
          </div>

          <Separator />

          {/* 2. Booking Window */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">2. Booking Window</h3>
            </div>
            <p className="text-xs text-muted-foreground">How many days in advance are you willing to book?</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Min:</Label>
                <Input
                  type="number"
                  value={criteria.minDaysInAdvance}
                  onChange={(e) => updateCriteria("minDaysInAdvance", parseInt(e.target.value) || 0)}
                  className="w-20"
                />
              </div>
              <span className="text-muted-foreground">to</span>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Max:</Label>
                <Input
                  type="number"
                  value={criteria.maxDaysInAdvance}
                  onChange={(e) => updateCriteria("maxDaysInAdvance", parseInt(e.target.value) || 0)}
                  className="w-20"
                />
              </div>
              <span className="text-xs text-muted-foreground">days</span>
            </div>
          </div>

          <Separator />

          {/* 3. Allowed Event Types */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">3. Allowed Event Types</h3>
            </div>
            <p className="text-xs text-muted-foreground">Which event types will you consider?</p>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`allowed-${option.value}`}
                    checked={criteria.allowedEventTypes.includes(option.value)}
                    onCheckedChange={() => toggleEventType(option.value, "allowedEventTypes")}
                  />
                  <Label htmlFor={`allowed-${option.value}`} className="text-sm cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 4. Preferred Event Types */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">4. Preferred Event Types</h3>
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Which types get priority approval?</p>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPE_OPTIONS.filter((o) => criteria.allowedEventTypes.includes(o.value)).map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`preferred-${option.value}`}
                    checked={criteria.preferredEventTypes.includes(option.value)}
                    onCheckedChange={() => toggleEventType(option.value, "preferredEventTypes")}
                  />
                  <Label htmlFor={`preferred-${option.value}`} className="text-sm cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 5. Borderline Fee Range */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">5. Borderline Fee Range</h3>
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Fee range that triggers manual review</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={criteria.borderlineFeeMin}
                  onChange={(e) => updateCriteria("borderlineFeeMin", parseInt(e.target.value) || 0)}
                  className="w-28"
                />
              </div>
              <span className="text-muted-foreground">to</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={criteria.borderlineFeeMax}
                  onChange={(e) => updateCriteria("borderlineFeeMax", parseInt(e.target.value) || 0)}
                  className="w-28"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* 6. Location Preferences */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">6. Location Preferences</h3>
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Priority Locations</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add city or region..."
                  value={priorityInput}
                  onChange={(e) => setPriorityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addLocation("priorityLocations", priorityInput);
                      setPriorityInput("");
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    addLocation("priorityLocations", priorityInput);
                    setPriorityInput("");
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {criteria.priorityLocations.map((loc) => (
                  <Badge key={loc} variant="secondary" className="gap-1">
                    {loc}
                    <button onClick={() => removeLocation("priorityLocations", loc)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Blocked Locations</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add city or region to block..."
                  value={blockedInput}
                  onChange={(e) => setBlockedInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addLocation("blockedLocations", blockedInput);
                      setBlockedInput("");
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    addLocation("blockedLocations", blockedInput);
                    setBlockedInput("");
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {criteria.blockedLocations.map((loc) => (
                  <Badge key={loc} variant="destructive" className="gap-1">
                    {loc}
                    <button onClick={() => removeLocation("blockedLocations", loc)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* 7. Special Conditions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">7. Special Deal Conditions</h3>
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Keywords to look for (e.g., &quot;travel covered&quot;, &quot;exclusive&quot;)</p>
            <Input
              placeholder="Enter keywords separated by commas..."
              value={criteria.specialConditions}
              onChange={(e) => updateCriteria("specialConditions", e.target.value)}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
