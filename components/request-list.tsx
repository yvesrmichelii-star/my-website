"use client";

import { BookingRequest } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { MapPin, DollarSign, Calendar } from "lucide-react";

interface RequestListProps {
  requests: BookingRequest[];
  selectedId: string | null;
  onSelect: (request: BookingRequest) => void;
}

const eventTypeLabels: Record<string, string> = {
  club: "Club",
  festival: "Festival",
  lounge: "Lounge",
  private: "Private Event",
  corporate: "Corporate",
  concert: "Concert",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  // Parse date string as UTC to avoid timezone discrepancies between server and client
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function RequestList({ requests, selectedId, onSelect }: RequestListProps) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-medium">No requests found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {requests.map((request) => (
        <button
          key={request.id}
          onClick={() => onSelect(request)}
          className={cn(
            "flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-accent/50",
            selectedId === request.id && "bg-accent"
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-medium text-muted-foreground">{request.id}</span>
              <StatusBadge status={request.status} />
            </div>

            <div className="mb-2">
              <h3 className="font-medium text-foreground truncate">{request.venueName}</h3>
              <p className="text-sm text-muted-foreground">{eventTypeLabels[request.eventType]}</p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {formatCurrency(request.proposedFee)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(request.eventDate)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {request.eventLocation}
              </span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(request.submissionDate)}
          </div>
        </button>
      ))}
    </div>
  );
}
