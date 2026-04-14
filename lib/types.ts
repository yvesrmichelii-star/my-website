export type BookingStatus = "draft" | "review" | "manual_review" | "reject";

export type EventType = "club" | "festival" | "lounge" | "private" | "corporate" | "concert";

export type RejectReason = 
  | "below_minimum_fee" 
  | "outside_booking_window" 
  | "too_short_notice"
  | "event_type_not_allowed"
  | "location_blocked";

export type ManualReviewReason =
  | "borderline_fee"
  | "non_preferred_event_type"
  | "location_needs_review"
  | "high_value_opportunity"
  | "special_conditions_noted";

export interface BookingRequest {
  id: string;
  artistName: string;
  eventType: EventType;
  proposedFee: number;
  eventDate: string;
  eventLocation: string;
  submissionDate: string;
  venueName: string;
  contactName: string;
  contactEmail: string;
  notes?: string;
  status: BookingStatus;
  reasonCode?: RejectReason;
  manualReviewReason?: ManualReviewReason;
  screeningDetails?: ScreeningDetails;
  // Contract-specific fields from DJ Booking Agreement format
  contractDetails?: ContractDetails;
  // Original contract file (stored in private blob storage)
  contractFilePath?: string;
  contractFileName?: string;
}

export interface ContractDetails {
  // Agreement parties
  djTalentName: string;
  djTalentAlias?: string;
  purchaserName: string;
  purchaserTitle?: string;
  purchaserCompany?: string;
  agreementDate: string;
  
  // Engagement details
  callTime?: string;
  setEndTime?: string;
  setDuration?: string;
  
  // Payment terms
  totalPayment: number;
  depositAmount: number;
  balanceAmount: number;
  depositDueHours?: number;
  balanceDueHours?: number;
  paymentMethods?: string[];
  
  // Cancellation terms
  cancellationNoticeDays?: number;
  
  // Equipment requirements
  equipmentProvidedBy: "purchaser" | "dj_talent" | "venue";
  equipmentRequirements?: string[];
  
  // Social media obligations
  socialMediaRequired?: boolean;
  socialMediaPlatforms?: string[];
  promoMaterialsDueDays?: number;
  
  // Legal
  governingLaw?: string;
  arbitrationRequired?: boolean;
  
  // Signature status
  purchaserSigned: boolean;
  purchaserSignatureDate?: string;
  djTalentSigned: boolean;
  djTalentSignatureDate?: string;
}

export interface ScreeningDetails {
  passedMinimumFee: boolean;
  withinBookingWindow: boolean;
  eventTypeAllowed: boolean;
  eventTypePreferred: boolean;
  locationAllowed: boolean;
  locationPreferred: boolean;
  specialConditionsMet: boolean;
  feeInBorderlineRange: boolean;
  daysUntilEvent: number;
  reasons: string[];
}

// The 7 screening criteria from managers
export interface ManagerCriteria {
  // 1. What is the minimum booking fee you will accept?
  minimumFee: number;
  
  // 2. What is the maximum number of days in advance you are willing to book?
  minDaysInAdvance: number;
  maxDaysInAdvance: number;
  
  // 3. What event types are allowed?
  allowedEventTypes: EventType[];
  
  // 4. Which event types are preferred? (optional)
  preferredEventTypes: EventType[];
  
  // 5. What fee range would you consider borderline for manual review? (optional)
  borderlineFeeMin: number;
  borderlineFeeMax: number;
  
  // 6. Are there any locations you want to prioritize or avoid? (optional)
  priorityLocations: string[];
  blockedLocations: string[];
  
  // 7. Are there any special deal conditions? (optional)
  specialConditions: string;
  
  // Feature toggles
  autoRejectEnabled: boolean;
  manualReviewFlagging: boolean;
}

export const DEFAULT_CRITERIA: ManagerCriteria = {
  minimumFee: 10000,
  minDaysInAdvance: 7,
  maxDaysInAdvance: 90,
  allowedEventTypes: ["club", "festival", "lounge", "private", "corporate", "concert"],
  preferredEventTypes: ["festival", "concert"],
  borderlineFeeMin: 8000,
  borderlineFeeMax: 12000,
  priorityLocations: ["Los Angeles", "New York", "Miami", "Las Vegas"],
  blockedLocations: [],
  specialConditions: "",
  autoRejectEnabled: true,
  manualReviewFlagging: true,
};
