import { 
  BookingRequest, 
  BookingStatus, 
  ManagerCriteria, 
  RejectReason, 
  ManualReviewReason,
  ScreeningDetails 
} from "./types";

export function screenBookingRequest(
  request: Omit<BookingRequest, "status" | "reasonCode" | "manualReviewReason" | "screeningDetails">,
  criteria: ManagerCriteria
): Pick<BookingRequest, "status" | "reasonCode" | "manualReviewReason" | "screeningDetails"> {
  const reasons: string[] = [];
  const today = new Date();
  const eventDate = new Date(request.eventDate);
  const daysUntilEvent = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Check minimum fee
  const passedMinimumFee = request.proposedFee >= criteria.minimumFee;
  if (passedMinimumFee) {
    reasons.push(`Fee of $${request.proposedFee.toLocaleString()} meets minimum threshold of $${criteria.minimumFee.toLocaleString()}`);
  } else {
    reasons.push(`Fee of $${request.proposedFee.toLocaleString()} is below minimum threshold of $${criteria.minimumFee.toLocaleString()}`);
  }

  // Check if fee is in borderline range
  const feeInBorderlineRange = 
    request.proposedFee >= criteria.borderlineFeeMin && 
    request.proposedFee < criteria.borderlineFeeMax;
  if (feeInBorderlineRange) {
    reasons.push(`Fee is in borderline range ($${criteria.borderlineFeeMin.toLocaleString()} - $${criteria.borderlineFeeMax.toLocaleString()})`);
  }

  // Check booking window
  const withinBookingWindow = 
    daysUntilEvent >= criteria.minDaysInAdvance && 
    daysUntilEvent <= criteria.maxDaysInAdvance;
  if (withinBookingWindow) {
    reasons.push(`Event is ${daysUntilEvent} days away, within acceptable window (${criteria.minDaysInAdvance}-${criteria.maxDaysInAdvance} days)`);
  } else if (daysUntilEvent < criteria.minDaysInAdvance) {
    reasons.push(`Event is only ${daysUntilEvent} days away, below minimum notice of ${criteria.minDaysInAdvance} days`);
  } else {
    reasons.push(`Event is ${daysUntilEvent} days away, beyond maximum advance booking of ${criteria.maxDaysInAdvance} days`);
  }

  // Check event type
  const eventTypeAllowed = criteria.allowedEventTypes.includes(request.eventType);
  const eventTypePreferred = criteria.preferredEventTypes.includes(request.eventType);
  if (eventTypePreferred) {
    reasons.push(`${formatEventType(request.eventType)} is a preferred event type`);
  } else if (eventTypeAllowed) {
    reasons.push(`${formatEventType(request.eventType)} is an allowed event type`);
  } else {
    reasons.push(`${formatEventType(request.eventType)} is not an allowed event type`);
  }

  // Check location
  const locationBlocked = criteria.blockedLocations.some(loc => 
    request.eventLocation.toLowerCase().includes(loc.toLowerCase())
  );
  const locationPreferred = criteria.priorityLocations.some(loc => 
    request.eventLocation.toLowerCase().includes(loc.toLowerCase())
  );
  const locationAllowed = !locationBlocked;

  if (locationPreferred) {
    reasons.push(`${request.eventLocation} is a priority location`);
  } else if (locationBlocked) {
    reasons.push(`${request.eventLocation} is a blocked location`);
  } else {
    reasons.push(`${request.eventLocation} - location accepted`);
  }

  // Check special conditions (if any notes match)
  const specialConditionsMet = criteria.specialConditions 
    ? request.notes?.toLowerCase().includes(criteria.specialConditions.toLowerCase()) ?? false
    : true;

  const screeningDetails: ScreeningDetails = {
    passedMinimumFee,
    withinBookingWindow,
    eventTypeAllowed,
    eventTypePreferred,
    locationAllowed,
    locationPreferred,
    specialConditionsMet,
    feeInBorderlineRange,
    daysUntilEvent,
    reasons,
  };

  // Determine status based on criteria
  let status: BookingStatus;
  let reasonCode: RejectReason | undefined;
  let manualReviewReason: ManualReviewReason | undefined;

  // Auto-reject conditions (if enabled)
  if (criteria.autoRejectEnabled) {
    if (!passedMinimumFee && !feeInBorderlineRange) {
      status = "reject";
      reasonCode = "below_minimum_fee";
      return { status, reasonCode, manualReviewReason, screeningDetails };
    }
    if (!eventTypeAllowed) {
      status = "reject";
      reasonCode = "event_type_not_allowed";
      return { status, reasonCode, manualReviewReason, screeningDetails };
    }
    if (locationBlocked) {
      status = "reject";
      reasonCode = "location_blocked";
      return { status, reasonCode, manualReviewReason, screeningDetails };
    }
    if (daysUntilEvent < criteria.minDaysInAdvance) {
      status = "reject";
      reasonCode = "too_short_notice";
      return { status, reasonCode, manualReviewReason, screeningDetails };
    }
  }

  // Manual review conditions (if enabled)
  if (criteria.manualReviewFlagging) {
    if (feeInBorderlineRange) {
      status = "manual_review";
      manualReviewReason = "borderline_fee";
      return { status, reasonCode, manualReviewReason, screeningDetails };
    }
    if (eventTypeAllowed && !eventTypePreferred) {
      status = "manual_review";
      manualReviewReason = "non_preferred_event_type";
      return { status, reasonCode, manualReviewReason, screeningDetails };
    }
    if (!withinBookingWindow && daysUntilEvent > criteria.maxDaysInAdvance) {
      status = "manual_review";
      manualReviewReason = "location_needs_review";
      return { status, reasonCode, manualReviewReason, screeningDetails };
    }
    if (request.proposedFee >= criteria.minimumFee * 3) {
      status = "manual_review";
      manualReviewReason = "high_value_opportunity";
      reasons.push(`High-value opportunity: $${request.proposedFee.toLocaleString()} (3x+ minimum fee)`);
      return { status, reasonCode, manualReviewReason, screeningDetails };
    }
  }

  // All checks passed - ready for review
  status = "review";
  return { status, reasonCode, manualReviewReason, screeningDetails };
}

function formatEventType(type: string): string {
  const labels: Record<string, string> = {
    club: "Club",
    festival: "Festival",
    lounge: "Lounge",
    private: "Private Event",
    corporate: "Corporate Event",
    concert: "Concert",
  };
  return labels[type] || type;
}
