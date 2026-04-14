"use client";

import { useState, useMemo, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { StatsCards } from "@/components/stats-cards";
import { FilterBar } from "@/components/filter-bar";
import { RequestList } from "@/components/request-list";
import { RequestDetail } from "@/components/request-detail";
import { ScreeningSettings } from "@/components/screening-settings";
import { ContractUpload } from "@/components/contract-upload";
import { ArtistSelector } from "@/components/artist-selector";
import { RequestMap } from "@/components/request-map";
import { RiskAssessment } from "@/components/risk-assessment";
import { mockBookingRequests, mockArtists, Artist } from "@/lib/mock-data";
import { BookingRequest, BookingStatus, ManagerCriteria, DEFAULT_CRITERIA } from "@/lib/types";
import { screenBookingRequest } from "@/lib/screening";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Map, Shield } from "lucide-react";

export default function DashboardPage() {
  const [requests, setRequests] = useState<BookingRequest[]>(mockBookingRequests);
  const [artists, setArtists] = useState<Artist[]>(mockArtists);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [criteria, setCriteria] = useState<ManagerCriteria>(DEFAULT_CRITERIA);
  const [viewMode, setViewMode] = useState<"list" | "map" | "risk">("list");

  // Filter requests by selected artist (null = show all artists)
  const artistRequests = useMemo(() => {
    if (!selectedArtist) return requests; // Show all requests when "All Artists" is selected
    return requests.filter((r) => r.artistName === selectedArtist.name);
  }, [requests, selectedArtist]);

  // Re-screen all requests when criteria changes
  const handleCriteriaChange = useCallback((newCriteria: ManagerCriteria) => {
    setCriteria(newCriteria);
    
    // Re-screen all existing requests with new criteria
    setRequests((prevRequests) =>
      prevRequests.map((request) => {
        const { status, reasonCode, manualReviewReason, screeningDetails } = screenBookingRequest(
          request,
          newCriteria
        );
        return { ...request, status, reasonCode, manualReviewReason, screeningDetails };
      })
    );

    // Update selected request if it exists
    if (selectedRequest) {
      const updated = screenBookingRequest(selectedRequest, newCriteria);
      setSelectedRequest((prev) => (prev ? { ...prev, ...updated } : null));
    }
  }, [selectedRequest]);

  // Handle new request from contract upload
  const handleRequestCreated = useCallback((newRequest: BookingRequest) => {
    // Assign to current artist if one is selected
    const requestWithArtist = selectedArtist 
      ? { ...newRequest, artistName: selectedArtist.name }
      : newRequest;
    setRequests((prev) => [requestWithArtist, ...prev]);
    setSelectedRequest(requestWithArtist);
  }, [selectedArtist]);

  // Handle adding a new artist
  const handleAddArtist = useCallback((artist: Artist) => {
    setArtists((prev) => [...prev, artist]);
    setSelectedArtist(artist);
  }, []);

  const stats = useMemo(() => {
    return {
      total: artistRequests.length,
      review: artistRequests.filter((r) => r.status === "review").length,
      reject: artistRequests.filter((r) => r.status === "reject").length,
      manualReview: artistRequests.filter((r) => r.status === "manual_review").length,
    };
  }, [artistRequests]);

  const filteredRequests = useMemo(() => {
    return artistRequests.filter((request) => {
      const query = searchQuery.toLowerCase().trim();
      
      if (query === "") {
        const matchesStatus = statusFilter === "all" || request.status === statusFilter;
        return matchesStatus;
      }

      // Search across all basic fields
      const basicFieldsMatch = 
        request.venueName.toLowerCase().includes(query) ||
        request.eventLocation.toLowerCase().includes(query) ||
        request.contactName.toLowerCase().includes(query) ||
        request.contactEmail.toLowerCase().includes(query) ||
        request.id.toLowerCase().includes(query) ||
        request.artistName.toLowerCase().includes(query) ||
        request.eventType.toLowerCase().includes(query) ||
        request.eventDate.includes(query) ||
        request.submissionDate.includes(query) ||
        String(request.proposedFee).includes(query) ||
        (request.notes?.toLowerCase().includes(query) ?? false) ||
        (request.status.toLowerCase().includes(query));

      // Search across contract details if they exist
      let contractFieldsMatch = false;
      if (request.contractDetails) {
        const cd = request.contractDetails;
        contractFieldsMatch = 
          cd.djTalentName.toLowerCase().includes(query) ||
          (cd.djTalentAlias?.toLowerCase().includes(query) ?? false) ||
          cd.purchaserName.toLowerCase().includes(query) ||
          (cd.purchaserTitle?.toLowerCase().includes(query) ?? false) ||
          (cd.purchaserCompany?.toLowerCase().includes(query) ?? false) ||
          cd.agreementDate.includes(query) ||
          (cd.callTime?.toLowerCase().includes(query) ?? false) ||
          (cd.setEndTime?.toLowerCase().includes(query) ?? false) ||
          (cd.setDuration?.toLowerCase().includes(query) ?? false) ||
          String(cd.totalPayment).includes(query) ||
          String(cd.depositAmount).includes(query) ||
          String(cd.balanceAmount).includes(query) ||
          cd.equipmentProvidedBy.toLowerCase().includes(query) ||
          (cd.equipmentRequirements?.some(eq => eq.toLowerCase().includes(query)) ?? false) ||
          (cd.socialMediaPlatforms?.some(p => p.toLowerCase().includes(query)) ?? false) ||
          (cd.governingLaw?.toLowerCase().includes(query) ?? false);
      }

      const matchesSearch = basicFieldsMatch || contractFieldsMatch;
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [artistRequests, searchQuery, statusFilter]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <DashboardHeader
        totalRequests={stats.total}
        pendingReview={stats.review + stats.manualReview}
      />

      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4">
          <ArtistSelector
            artists={artists}
            selectedArtist={selectedArtist}
            onSelectArtist={setSelectedArtist}
            onAddArtist={handleAddArtist}
          />
          <StatsCards
            total={stats.total}
            review={stats.review}
            reject={stats.reject}
            manualReview={stats.manualReview}
          />
        </div>
        <div className="flex items-center gap-3">
          <ContractUpload onRequestCreated={handleRequestCreated} criteria={criteria} />
          <ScreeningSettings criteria={criteria} onCriteriaChange={handleCriteriaChange} />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Request list or Map */}
        <div className="flex w-full flex-col border-r border-border lg:w-[400px] xl:w-[480px]">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "map" | "risk")} className="w-full">
              <div className="flex items-center justify-between">
                <TabsList className="h-9">
                  <TabsTrigger value="list" className="gap-1.5 px-3">
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">List</span>
                  </TabsTrigger>
                  <TabsTrigger value="map" className="gap-1.5 px-3">
                    <Map className="h-4 w-4" />
                    <span className="hidden sm:inline">Map</span>
                  </TabsTrigger>
                  <TabsTrigger value="risk" className="gap-1.5 px-3">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Risk</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          </div>

          {viewMode === "list" ? (
            <>
              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
              />
              <div className="flex-1 overflow-y-auto bg-card">
                <RequestList
                  requests={filteredRequests}
                  selectedId={selectedRequest?.id ?? null}
                  onSelect={setSelectedRequest}
                />
              </div>
            </>
          ) : viewMode === "map" ? (
            <div className="flex-1 overflow-hidden bg-card">
              <RequestMap
                requests={filteredRequests}
                artist={selectedArtist}
                onSelectRequest={setSelectedRequest}
                selectedRequestId={selectedRequest?.id}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden bg-card">
              <RiskAssessment
                requests={filteredRequests}
                criteria={criteria}
                onSelectRequest={setSelectedRequest}
                selectedRequestId={selectedRequest?.id}
              />
            </div>
          )}
        </div>

        {/* Right panel - Request detail */}
        <div className="hidden flex-1 lg:block">
          <RequestDetail request={selectedRequest} criteria={criteria} />
        </div>
      </div>

      {/* Mobile detail view */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-background lg:hidden">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="font-semibold text-foreground">Request Details</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-md p-2 text-muted-foreground hover:bg-accent"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <RequestDetail request={selectedRequest} criteria={criteria} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
