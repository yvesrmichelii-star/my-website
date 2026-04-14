"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { BookingRequest, EventType, ManagerCriteria, ContractDetails } from "@/lib/types";
import { screenBookingRequest } from "@/lib/screening";

interface ContractUploadProps {
  onRequestCreated: (request: BookingRequest) => void;
  criteria: ManagerCriteria;
}

type UploadStatus = "idle" | "uploading" | "parsing" | "success" | "error";

interface ParsedContract {
  // Basic booking info
  venueName: string;
  contactName: string;
  contactEmail: string;
  eventDate: string;
  eventLocation: string;
  proposedFee: number;
  eventType: EventType;
  notes: string;
  // DJ Booking Agreement format fields
  contractDetails: ContractDetails;
}

export function ContractUpload({ onRequestCreated, criteria }: ContractUploadProps) {
  const [open, setOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [parsedData, setParsedData] = useState<ParsedContract | null>(null);
  const [editedData, setEditedData] = useState<ParsedContract | null>(null);
  const [contractFilePath, setContractFilePath] = useState<string | null>(null);

  // Parse contract using AI
  const parseContractWithAI = useCallback(async (file: File): Promise<ParsedContract | null> => {
    try {
      // Convert file to base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const response = await fetch('/api/parse-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse contract');
      }

      const { contractData: cd } = await response.json();
      
      // Extract city/state from address
      const addressParts = (cd.venueAddress || "").split(", ");
      const cityState = addressParts.length >= 2 
        ? `${addressParts[addressParts.length - 2]}, ${addressParts[addressParts.length - 1].split(" ")[0]}`
        : cd.venueAddress || "";

      // Determine event type based on venue name
      let eventType: EventType = "lounge";
      const venueNameLower = (cd.venueName || "").toLowerCase();
      if (venueNameLower.includes("club") || venueNameLower.includes("nightclub")) {
        eventType = "club";
      } else if (venueNameLower.includes("lounge") || venueNameLower.includes("restaurant")) {
        eventType = "lounge";
      } else if (venueNameLower.includes("festival")) {
        eventType = "festival";
      } else if (venueNameLower.includes("arena") || venueNameLower.includes("amphitheatre")) {
        eventType = "concert";
      } else if (venueNameLower.includes("private") || venueNameLower.includes("estate")) {
        eventType = "private";
      }

      // Generate email from purchaser info
      const purchaserEmail = cd.purchaserCompany 
        ? `${(cd.purchaserName || "contact").toLowerCase().replace(" ", ".")}@${cd.purchaserCompany.toLowerCase().replace(/\s+/g, "").replace(/llc|inc|corp/gi, "")}.com`
        : `${(cd.purchaserName || "contact").toLowerCase().replace(" ", ".")}@example.com`;

      return {
        venueName: cd.venueName || "",
        contactName: cd.purchaserName || "",
        contactEmail: purchaserEmail,
        eventDate: cd.eventDate || "",
        eventLocation: cityState,
        proposedFee: cd.totalPayment || 0,
        eventType,
        notes: `DJ Booking Agreement for ${cd.djTalentAlias || cd.djTalentName || "Artist"}. ${cd.callTime && cd.setEndTime ? `Set: ${cd.callTime} - ${cd.setEndTime}` : ""} ${cd.setDuration ? `(${cd.setDuration})` : ""}. Deposit: $${(cd.depositAmount || 0).toFixed(2)}, Balance: $${(cd.balanceAmount || 0).toFixed(2)}.`,
        contractDetails: {
          djTalentName: cd.djTalentName || "",
          djTalentAlias: cd.djTalentAlias || undefined,
          purchaserName: cd.purchaserName || "",
          purchaserTitle: cd.purchaserTitle || undefined,
          purchaserCompany: cd.purchaserCompany || undefined,
          agreementDate: cd.agreementDate || "",
          callTime: cd.callTime || undefined,
          setEndTime: cd.setEndTime || undefined,
          setDuration: cd.setDuration || undefined,
          totalPayment: cd.totalPayment || 0,
          depositAmount: cd.depositAmount || 0,
          balanceAmount: cd.balanceAmount || 0,
          depositDueHours: cd.depositDueHours || undefined,
          balanceDueHours: cd.balanceDueHours || undefined,
          cancellationNoticeDays: cd.cancellationNoticeDays || undefined,
          equipmentProvidedBy: cd.equipmentProvidedBy || "purchaser",
          equipmentRequirements: cd.equipmentRequirements || undefined,
          socialMediaRequired: cd.socialMediaRequired || false,
          socialMediaPlatforms: cd.socialMediaPlatforms || undefined,
          promoMaterialsDueDays: cd.promoMaterialsDueDays || undefined,
          governingLaw: cd.governingLaw || undefined,
          arbitrationRequired: cd.arbitrationRequired || false,
          purchaserSigned: cd.purchaserSigned || false,
          purchaserSignatureDate: cd.purchaserSignatureDate || undefined,
          djTalentSigned: cd.djTalentSigned || false,
          djTalentSignatureDate: cd.djTalentSignatureDate || undefined,
        },
      };
    } catch (error) {
      console.error('Error parsing contract with AI:', error);
      return null;
    }
  }, []);

  const uploadFileToBlob = useCallback(async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-contract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      return data.pathname;
    } catch (error) {
      console.error('Error uploading file to blob:', error);
      return null;
    }
  }, []);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      setUploadStatus("uploading");

      // Upload to Blob storage first
      const filePath = await uploadFileToBlob(file);
      if (filePath) {
        setContractFilePath(filePath);
      } else {
        setUploadStatus("error");
        return;
      }

      setUploadStatus("parsing");

      // Try to parse the contract using AI
      const parsed = await parseContractWithAI(file);
      
      if (parsed) {
        setParsedData(parsed);
        setEditedData(parsed);
        setUploadStatus("success");
      } else {
        // AI parsing failed - automatically go to manual entry with file already uploaded
        const emptyData: ParsedContract = {
          venueName: "",
          contactName: "",
          contactEmail: "",
          eventDate: "",
          eventLocation: "",
          proposedFee: 0,
          eventType: "club",
          notes: `Contract uploaded: ${file.name}`,
          contractDetails: {
            djTalentName: "",
            purchaserName: "",
            agreementDate: "",
            totalPayment: 0,
            depositAmount: 0,
            balanceAmount: 0,
            equipmentProvidedBy: "purchaser",
            purchaserSigned: false,
            djTalentSigned: false,
          },
        };
        setParsedData(emptyData);
        setEditedData(emptyData);
        setUploadStatus("success");
      }
    },
    [parseContractWithAI, uploadFileToBlob]
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (!file) return;

      setFileName(file.name);
      setUploadStatus("uploading");

      // Upload to Blob storage first
      const filePath = await uploadFileToBlob(file);
      if (filePath) {
        setContractFilePath(filePath);
      } else {
        setUploadStatus("error");
        return;
      }

      setUploadStatus("parsing");

      // Try to parse the contract using AI
      const parsed = await parseContractWithAI(file);
      
      if (parsed) {
        setParsedData(parsed);
        setEditedData(parsed);
        setUploadStatus("success");
      } else {
        // AI parsing failed - automatically go to manual entry with file already uploaded
        const emptyData: ParsedContract = {
          venueName: "",
          contactName: "",
          contactEmail: "",
          eventDate: "",
          eventLocation: "",
          proposedFee: 0,
          eventType: "club",
          notes: `Contract uploaded: ${file.name}`,
          contractDetails: {
            djTalentName: "",
            purchaserName: "",
            agreementDate: "",
            totalPayment: 0,
            depositAmount: 0,
            balanceAmount: 0,
            equipmentProvidedBy: "purchaser",
            purchaserSigned: false,
            djTalentSigned: false,
          },
        };
        setParsedData(emptyData);
        setEditedData(emptyData);
        setUploadStatus("success");
      }
    },
    [parseContractWithAI, uploadFileToBlob]
  );

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleSubmit = () => {
    if (!editedData) return;

    // Use DJ/Talent name from contract details if available
    const artistName = editedData.contractDetails?.djTalentAlias 
      || editedData.contractDetails?.djTalentName 
      || "Client Artist";

    // Create base request without screening results
    const baseRequest = {
      id: `REQ-${Date.now()}`,
      artistName,
      venueName: editedData.venueName,
      contactName: editedData.contactName,
      contactEmail: editedData.contactEmail,
      eventDate: editedData.eventDate,
      eventLocation: editedData.eventLocation,
      proposedFee: editedData.proposedFee,
      eventType: editedData.eventType,
      notes: editedData.notes,
      submissionDate: new Date().toISOString().split("T")[0],
      contractDetails: editedData.contractDetails,
      // Include contract file path if uploaded (for private blob storage)
      contractFilePath: contractFilePath || undefined,
      contractFileName: fileName || undefined,
    };

    // Run screening against the criteria
    const screeningResult = screenBookingRequest(baseRequest, criteria);

    const newRequest: BookingRequest = {
      ...baseRequest,
      ...screeningResult,
    };

    onRequestCreated(newRequest);
    handleReset();
    setOpen(false);
  };

  const handleReset = () => {
    setUploadStatus("idle");
    setFileName("");
    setParsedData(null);
    setEditedData(null);
    setContractFilePath(null);
  };

  const updateField = <K extends keyof ParsedContract>(field: K, value: ParsedContract[K]) => {
    if (!editedData) return;
    setEditedData({ ...editedData, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Contract
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Contract</DialogTitle>
          <DialogDescription>
            Upload a booking contract and we&apos;ll automatically extract the details and screen it against your criteria.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Upload Zone */}
          {uploadStatus === "idle" && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:border-primary hover:bg-muted/50"
            >
              <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="mb-2 text-sm font-medium text-foreground">
                Drag and drop your contract here
              </p>
              <p className="mb-4 text-xs text-muted-foreground">
                Supports PDF, DOC, DOCX files
              </p>
              <label htmlFor="contract-upload">
                <Button variant="secondary" className="cursor-pointer" asChild>
                  <span>Browse Files</span>
                </Button>
                <input
                  id="contract-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          )}

          {/* Processing State */}
          {(uploadStatus === "uploading" || uploadStatus === "parsing") && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 p-8">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
              <div className="flex items-center gap-2 text-sm text-foreground">
                <FileText className="h-4 w-4" />
                <span>{fileName}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {uploadStatus === "uploading" ? "Uploading contract..." : "Scanning and extracting details..."}
              </p>
            </div>
          )}

          {/* Success - Show Parsed Data */}
          {uploadStatus === "success" && editedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-sm">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-foreground">
                  Contract scanned successfully. Verify details before creating request.
                </span>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="venueName">Venue Name</Label>
                    <Input
                      id="venueName"
                      value={editedData.venueName}
                      onChange={(e) => updateField("venueName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventType">Event Type</Label>
                    <Select
                      value={editedData.eventType}
                      onValueChange={(value) => updateField("eventType", value as EventType)}
                    >
                      <SelectTrigger id="eventType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="club">Club</SelectItem>
                        <SelectItem value="festival">Festival</SelectItem>
                        <SelectItem value="lounge">Lounge</SelectItem>
                        <SelectItem value="private">Private Event</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="concert">Concert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Event Date</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={editedData.eventDate}
                      onChange={(e) => updateField("eventDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventLocation">Location</Label>
                    <Input
                      id="eventLocation"
                      value={editedData.eventLocation}
                      onChange={(e) => updateField("eventLocation", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proposedFee">Proposed Fee ($)</Label>
                  <Input
                    id="proposedFee"
                    type="number"
                    value={editedData.proposedFee}
                    onChange={(e) => updateField("proposedFee", parseInt(e.target.value) || 0)}
                  />
                  {editedData.proposedFee < criteria.minimumFee && (
                    <p className="text-xs text-destructive">
                      Below minimum fee of ${criteria.minimumFee.toLocaleString()}
                    </p>
                  )}
                  {editedData.proposedFee >= criteria.borderlineFeeMin && 
                   editedData.proposedFee < criteria.borderlineFeeMax && (
                    <p className="text-xs text-warning">
                      In borderline range - will be flagged for manual review
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input
                      id="contactName"
                      value={editedData.contactName}
                      onChange={(e) => updateField("contactName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={editedData.contactEmail}
                      onChange={(e) => updateField("contactEmail", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editedData.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleReset}>
                  Upload Different File
                </Button>
                <Button onClick={handleSubmit}>Create & Screen Request</Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {uploadStatus === "error" && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-8">
              <AlertCircle className="mb-4 h-10 w-10 text-destructive" />
              <p className="mb-2 text-sm font-medium text-foreground">Failed to parse contract</p>
              <p className="mb-4 text-xs text-muted-foreground">
                The file was uploaded. You can enter the details manually.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Try Again
                </Button>
                <Button onClick={() => {
                  // Create empty parsed data for manual entry
                  const emptyData: ParsedContract = {
                    venueName: "",
                    contactName: "",
                    contactEmail: "",
                    eventDate: "",
                    eventLocation: "",
                    proposedFee: 0,
                    eventType: "club",
                    notes: "",
                    contractDetails: {
                      djTalentName: "",
                      purchaserName: "",
                      agreementDate: "",
                      totalPayment: 0,
                      depositAmount: 0,
                      balanceAmount: 0,
                      equipmentProvidedBy: "purchaser",
                      purchaserSigned: false,
                      djTalentSigned: false,
                    },
                  };
                  setParsedData(emptyData);
                  setEditedData(emptyData);
                  setUploadStatus("success");
                }}>
                  Enter Manually
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
