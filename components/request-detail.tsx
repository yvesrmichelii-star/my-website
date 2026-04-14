"use client";
import { screenBookingRequest } from "@/lib/screening"; 
import { BookingRequest, ManagerCriteria } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  DollarSign,
  Calendar,
  User,
  Mail,
  Building,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Music,
  Star,
  Download,
  ExternalLink,
} from "lucide-react";

interface RequestDetailProps {
  request: BookingRequest | null;
  criteria: ManagerCriteria;
}

const eventTypeLabels: Record<string, string> = {
  club: "Club",
  festival: "Festival",
  lounge: "Lounge",
  private: "Private Event",
  corporate: "Corporate",
  concert: "Concert",
};

const reasonLabels: Record<string, string> = {
  below_minimum_fee: "Below minimum fee threshold",
  outside_booking_window: "Outside acceptable booking window",
  too_short_notice: "Too short notice for booking",
  event_type_not_allowed: "Event type not allowed",
  location_blocked: "Location is blocked",
};

const manualReviewLabels: Record<string, string> = {
  borderline_fee: "Fee is in borderline range",
  non_preferred_event_type: "Event type is allowed but not preferred",
  location_needs_review: "Location needs manual review",
  high_value_opportunity: "High-value opportunity detected",
  special_conditions_noted: "Special conditions found in notes",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getDaysUntilEvent(dateString: string): number {
  const [year, month, day] = dateString.split("-").map(Number);
  const eventDate = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function RequestDetail({ request, criteria }: RequestDetailProps) {
  if (!request) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground">Select a request</h3>
        <p className="text-sm text-muted-foreground">
          Choose a booking request from the list to view details
        </p>
      </div>
    );
  }

  const daysUntil = getDaysUntilEvent(request.eventDate);

// ✅ Confirm + screen booking (NEW)
const handleConfirmAndScreen = () => {
  if (!request) return;

  const screeningResult = screenBookingRequest(request, criteria);

  const finalizedRequest: BookingRequest = {
    ...request,
    ...screeningResult,
  };

  // TEMP: replace with your state/store update
  console.log("Finalized booking request:", finalizedRequest);
};

  // Calculate screening checks based on current criteria
  const feeCheck = request.proposedFee >= criteria.minimumFee;
  const feeInBorderline = request.proposedFee >= criteria.borderlineFeeMin && 
                          request.proposedFee < criteria.borderlineFeeMax;
  const bookingWindowCheck = daysUntil >= criteria.minDaysInAdvance && 
                             daysUntil <= criteria.maxDaysInAdvance;
  const eventTypeCheck = criteria.allowedEventTypes.includes(request.eventType);
  const eventTypePreferred = criteria.preferredEventTypes.includes(request.eventType);
  const locationBlocked = criteria.blockedLocations.some(loc => 
    request.eventLocation.toLowerCase().includes(loc.toLowerCase())
  );
  const locationPreferred = criteria.priorityLocations.some(loc => 
    request.eventLocation.toLowerCase().includes(loc.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">{request.id}</span>
              <StatusBadge status={request.status} />
      
              {request.status === "draft" && (
                <Badge variant="outline">
                  Auto‑populated · Pending confirmation
                </Badge>
              )}

            </div>
            <h2 className="text-2xl font-semibold text-foreground">{request.venueName}</h2>
            <p className="text-muted-foreground">{eventTypeLabels[request.eventType]}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{formatCurrency(request.proposedFee)}</p>
            <p className="text-sm text-muted-foreground">Proposed Fee</p>
          </div>
        </div>

        {/* Status Banner */}
        {request.status === "reject" && request.reasonCode && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-destructive font-medium">Rejected: {reasonLabels[request.reasonCode]}</span>
          </div>
        )}
        {request.status === "manual_review" && request.manualReviewReason && (
          <div className="flex items-center gap-2 rounded-lg bg-warning/10 border border-warning/30 px-4 py-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-warning font-medium">Flagged: {manualReviewLabels[request.manualReviewReason]}</span>
          </div>
        )}
        {request.status === "review" && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/30 px-4 py-3 text-sm">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span className="text-primary font-medium">All criteria met - Ready for review</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Screening Checklist - Based on 7 Criteria */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Screening Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 1. Minimum Fee */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Minimum Fee (${criteria.minimumFee.toLocaleString()})</span>
                </div>
                {feeCheck ? (
                  <Badge variant="outline" className="gap-1 border-primary/50 text-primary bg-primary/5">
                    <CheckCircle className="h-3 w-3" /> Pass
                  </Badge>
                ) : feeInBorderline ? (
                  <Badge variant="outline" className="gap-1 border-warning/50 text-warning bg-warning/5">
                    <AlertTriangle className="h-3 w-3" /> Borderline
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-destructive/50 text-destructive bg-destructive/5">
                    <XCircle className="h-3 w-3" /> Fail
                  </Badge>
                )}
              </div>

              {/* 2. Booking Window */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Booking Window ({criteria.minDaysInAdvance}-{criteria.maxDaysInAdvance} days)</span>
                </div>
                {bookingWindowCheck ? (
                  <Badge variant="outline" className="gap-1 border-primary/50 text-primary bg-primary/5">
                    <CheckCircle className="h-3 w-3" /> {daysUntil} days
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-destructive/50 text-destructive bg-destructive/5">
                    <XCircle className="h-3 w-3" /> {daysUntil} days
                  </Badge>
                )}
              </div>

              {/* 3 & 4. Event Type (Allowed + Preferred) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Event Type ({eventTypeLabels[request.eventType]})</span>
                </div>
                {eventTypePreferred ? (
                  <Badge variant="outline" className="gap-1 border-primary/50 text-primary bg-primary/5">
                    <Star className="h-3 w-3" /> Preferred
                  </Badge>
                ) : eventTypeCheck ? (
                  <Badge variant="outline" className="gap-1 border-primary/50 text-primary bg-primary/5">
                    <CheckCircle className="h-3 w-3" /> Allowed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-destructive/50 text-destructive bg-destructive/5">
                    <XCircle className="h-3 w-3" /> Not Allowed
                  </Badge>
                )}
              </div>

              {/* 5. Borderline Fee Range */}
              {feeInBorderline && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Borderline Range (${criteria.borderlineFeeMin.toLocaleString()}-${criteria.borderlineFeeMax.toLocaleString()})</span>
                  </div>
                  <Badge variant="outline" className="gap-1 border-warning/50 text-warning bg-warning/5">
                    <AlertTriangle className="h-3 w-3" /> In Range
                  </Badge>
                </div>
              )}

              {/* 6. Location */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Location ({request.eventLocation})</span>
                </div>
                {locationBlocked ? (
                  <Badge variant="outline" className="gap-1 border-destructive/50 text-destructive bg-destructive/5">
                    <XCircle className="h-3 w-3" /> Blocked
                  </Badge>
                ) : locationPreferred ? (
                  <Badge variant="outline" className="gap-1 border-primary/50 text-primary bg-primary/5">
                    <Star className="h-3 w-3" /> Priority
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-primary/50 text-primary bg-primary/5">
                    <CheckCircle className="h-3 w-3" /> Accepted
                  </Badge>
                )}
              </div>

              {/* 7. Special Conditions */}
              {criteria.specialConditions && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Special Conditions</span>
                  </div>
                  {request.notes?.toLowerCase().includes(criteria.specialConditions.toLowerCase()) ? (
                    <Badge variant="outline" className="gap-1 border-primary/50 text-primary bg-primary/5">
                      <CheckCircle className="h-3 w-3" /> Found
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 border-muted-foreground/50 text-muted-foreground">
                      Not Found
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">{formatDate(request.eventDate)}</p>
                  <p className="text-xs text-muted-foreground">Event Date ({daysUntil} days away)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">{request.eventLocation}</p>
                  <p className="text-xs text-muted-foreground">Location</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">{request.venueName}</p>
                  <p className="text-xs text-muted-foreground">Venue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">{request.contactName}</p>
                  <p className="text-xs text-muted-foreground">Contact Person</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">{request.contactEmail}</p>
                  <p className="text-xs text-muted-foreground">Email</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract PDF Section */}
          {request.contractFilePath && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-medium text-muted-foreground">Contract PDF</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/file?pathname=${encodeURIComponent(request.contractFilePath)}`} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/file?pathname=${encodeURIComponent(request.contractFilePath)}`} download={request.contractFileName} className="gap-1.5">
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{request.contractFileName || "Contract.pdf"}</span>
                  </div>
                  <iframe
                    src={`/api/file?pathname=${encodeURIComponent(request.contractFilePath)}`}
                    className="w-full h-[400px] bg-white"
                    title="Contract PDF Viewer"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {request.notes && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground leading-relaxed">{request.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Contract Details Section - DJ Booking Agreement Format */}
          {request.contractDetails && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Contract Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Parties */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Agreement Parties</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">DJ/Talent:</span>
                      <span className="font-medium text-foreground">
                        {request.contractDetails.djTalentName}
                        {request.contractDetails.djTalentAlias && (
                          <span className="text-muted-foreground"> p/k/a &quot;{request.contractDetails.djTalentAlias}&quot;</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Purchaser:</span>
                      <span className="font-medium text-foreground">
                        {request.contractDetails.purchaserCompany || request.contractDetails.purchaserName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Agreement Date:</span>
                      <span className="font-medium text-foreground">{formatDate(request.contractDetails.agreementDate)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Set Times */}
                {(request.contractDetails.callTime || request.contractDetails.setDuration) && (
                  <>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Performance Schedule</p>
                      <div className="space-y-2">
                        {request.contractDetails.callTime && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Call Time / Set Start:</span>
                            <span className="font-medium text-foreground">{request.contractDetails.callTime}</span>
                          </div>
                        )}
                        {request.contractDetails.setEndTime && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Set End:</span>
                            <span className="font-medium text-foreground">{request.contractDetails.setEndTime}</span>
                          </div>
                        )}
                        {request.contractDetails.setDuration && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="font-medium text-foreground">{request.contractDetails.setDuration}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Payment Terms */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Payment Terms</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Payment:</span>
                      <span className="font-medium text-foreground">{formatCurrency(request.contractDetails.totalPayment)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Deposit (non-refundable):</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(request.contractDetails.depositAmount)}
                        {request.contractDetails.depositDueHours && (
                          <span className="text-muted-foreground"> (due within {request.contractDetails.depositDueHours}h)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Balance:</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(request.contractDetails.balanceAmount)}
                        {request.contractDetails.balanceDueHours && (
                          <span className="text-muted-foreground"> (due {request.contractDetails.balanceDueHours}h after event)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Equipment */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Equipment</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Provided By:</span>
                      <Badge variant="outline" className="capitalize">
                        {request.contractDetails.equipmentProvidedBy.replace("_", " ")}
                      </Badge>
                    </div>
                    {request.contractDetails.equipmentRequirements && request.contractDetails.equipmentRequirements.length > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Requirements:</span>
                        <ul className="mt-1 list-disc list-inside text-foreground">
                          {request.contractDetails.equipmentRequirements.map((req, idx) => (
                            <li key={idx} className="text-sm">{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Social Media & Promotion */}
                {request.contractDetails.socialMediaRequired && (
                  <>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Social Media Promotion</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Required:</span>
                          <Badge variant="outline" className="border-primary/50 text-primary bg-primary/5">Yes</Badge>
                        </div>
                        {request.contractDetails.socialMediaPlatforms && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Platforms:</span>
                            <span className="font-medium text-foreground">
                              {request.contractDetails.socialMediaPlatforms.join(", ")}
                            </span>
                          </div>
                        )}
                        {request.contractDetails.promoMaterialsDueDays && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Promo Materials Due:</span>
                            <span className="font-medium text-foreground">
                              {request.contractDetails.promoMaterialsDueDays} days before event
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Terms */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Contract Terms</p>
                  <div className="space-y-2">
                    {request.contractDetails.cancellationNoticeDays && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Cancellation Notice:</span>
                        <span className="font-medium text-foreground">{request.contractDetails.cancellationNoticeDays} days</span>
                      </div>
                    )}
                    {request.contractDetails.governingLaw && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Governing Law:</span>
                        <span className="font-medium text-foreground">{request.contractDetails.governingLaw}</span>
                      </div>
                    )}
                    {request.contractDetails.arbitrationRequired && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Dispute Resolution:</span>
                        <span className="font-medium text-foreground">AAA Arbitration</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Signatures */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Signatures</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Purchaser Signed:</span>
                      {request.contractDetails.purchaserSigned ? (
                        <Badge variant="outline" className="gap-1 border-primary/50 text-primary bg-primary/5">
                          <CheckCircle className="h-3 w-3" />
                          {request.contractDetails.purchaserSignatureDate && formatDate(request.contractDetails.purchaserSignatureDate)}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 border-warning/50 text-warning bg-warning/5">
                          <AlertTriangle className="h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">DJ/Talent Signed:</span>
                      {request.contractDetails.djTalentSigned ? (
                        <Badge variant="outline" className="gap-1 border-primary/50 text-primary bg-primary/5">
                          <CheckCircle className="h-3 w-3" />
                          {request.contractDetails.djTalentSignatureDate && formatDate(request.contractDetails.djTalentSignatureDate)}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 border-warning/50 text-warning bg-warning/5">
                          <AlertTriangle className="h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Separator />
      


      <div className="flex items-center justify-end gap-3 p-4 bg-card">
        
{request.status === "draft" && (
  <Button
    className="bg-primary text-primary-foreground"
    onClick={handleConfirmAndScreen}
  >
    Confirm & Screen Booking
  </Button>
)}

        {request.status === "manual_review" && (
          <>
            <Button variant="outline">Request More Info</Button>
            <Button variant="destructive">Reject</Button>
            <Button className="bg-primary text-primary-foreground">Approve</Button>
          </>
        )}
        {request.status === "reject" && (
          <>
            <Button variant="outline">Send Rejection Notice</Button>
            <Button variant="secondary">Override & Approve</Button>
          </>
        )}
      </div>
    </div>
  );
}
