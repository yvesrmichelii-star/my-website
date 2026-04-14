"use client";

import { useMemo, useState } from "react";
import { BookingRequest } from "@/lib/types";
import { Artist, locationCoordinates } from "@/lib/mock-data";
import { MapPin, Navigation2, Globe, DollarSign, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
} from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface RequestMapProps {
  requests: BookingRequest[];
  artist: Artist | null;
  onSelectRequest?: (request: BookingRequest) => void;
  selectedRequestId?: string | null;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(miles: number): string {
  if (miles >= 1000) {
    return `${(miles / 1000).toFixed(1)}k mi`;
  }
  return `${Math.round(miles).toLocaleString()} mi`;
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}k`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface LocationGroup {
  location: string;
  coordinates: { lat: number; lng: number } | null;
  distance: number | null;
  requests: BookingRequest[];
  totalFee: number;
  heatLevel: number; // 0-1 representing intensity
}

// Heat map color scale (cool to hot) using site theme colors
function getHeatColor(intensity: number): string {
  // Green (primary) -> Yellow -> Orange -> Red
  if (intensity < 0.25) {
    return "hsl(145, 60%, 45%)"; // Cool green (primary)
  } else if (intensity < 0.5) {
    return "hsl(85, 60%, 50%)"; // Yellow-green
  } else if (intensity < 0.75) {
    return "hsl(45, 80%, 55%)"; // Orange/warning
  } else {
    return "hsl(0, 70%, 55%)"; // Hot red
  }
}

function getHeatGlow(intensity: number): string {
  if (intensity < 0.25) {
    return "rgba(34, 197, 94, 0.4)";
  } else if (intensity < 0.5) {
    return "rgba(132, 204, 22, 0.4)";
  } else if (intensity < 0.75) {
    return "rgba(245, 158, 11, 0.5)";
  } else {
    return "rgba(239, 68, 68, 0.6)";
  }
}

export function RequestMap({
  requests,
  artist,
  onSelectRequest,
  selectedRequestId,
}: RequestMapProps) {
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Group requests by location and calculate distances + heat levels
  const locationGroups = useMemo(() => {
    const groups: Record<string, LocationGroup> = {};

    requests.forEach((request) => {
      const location = request.eventLocation;
      if (!groups[location]) {
        const coords = locationCoordinates[location] || null;
        let distance: number | null = null;

        if (coords && artist) {
          distance = calculateDistance(
            artist.coordinates.lat,
            artist.coordinates.lng,
            coords.lat,
            coords.lng
          );
        }

        groups[location] = {
          location,
          coordinates: coords,
          distance,
          requests: [],
          totalFee: 0,
          heatLevel: 0,
        };
      }
      groups[location].requests.push(request);
      groups[location].totalFee += request.proposedFee;
    });

    // Calculate heat levels based on total fee (value)
    const maxFee = Math.max(...Object.values(groups).map((g) => g.totalFee));
    Object.values(groups).forEach((g) => {
      g.heatLevel = maxFee > 0 ? g.totalFee / maxFee : 0;
    });

    return Object.values(groups).sort((a, b) => {
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return a.location.localeCompare(b.location);
    });
  }, [requests, artist]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalRevenue = requests.reduce((sum, r) => sum + r.proposedFee, 0);
    const avgDistance =
      locationGroups.filter((g) => g.distance !== null).reduce((sum, g) => sum + (g.distance || 0), 0) /
        locationGroups.filter((g) => g.distance !== null).length || 0;
    return {
      totalRevenue,
      avgDistance,
      cityCount: locationGroups.length,
      requestCount: requests.length,
    };
  }, [requests, locationGroups]);

  // Check if we have international locations (Dubai)
  const hasInternational = locationGroups.some(
    (g) => g.location.includes("UAE") || g.location.includes("Dubai")
  );

  const hoveredGroup = locationGroups.find((g) => g.location === hoveredLocation);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Stats Bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          {artist && (
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
              <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-sm font-medium text-primary">{artist.name}</span>
            </div>
          )}
          <span className="text-sm text-muted-foreground/50">|</span>
          <span className="text-sm text-muted-foreground">{artist?.baseLocation}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</span>
            <span className="text-xs text-muted-foreground">potential revenue</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col items-end">
            <span className="text-xl font-bold text-foreground">{stats.cityCount}</span>
            <span className="text-xs text-muted-foreground">cities</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col items-end">
            <span className="text-xl font-bold text-foreground">{stats.requestCount}</span>
            <span className="text-xs text-muted-foreground">requests</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative flex-1 overflow-hidden bg-muted/30">
        {locationGroups.length > 0 ? (
          <div className="relative h-[320px] w-full">
            <ComposableMap
              projection="geoAlbersUsa"
              projectionConfig={{
                scale: 1000,
              }}
              style={{
                width: "100%",
                height: "100%",
              }}
            >
              <ZoomableGroup center={[-96, 38]} zoom={1}>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="hsl(var(--muted))"
                        stroke="hsl(var(--border))"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none" },
                          hover: { outline: "none", fill: "hsl(var(--accent))" },
                          pressed: { outline: "none" },
                        }}
                      />
                    ))
                  }
                </Geographies>

                {/* Connection lines from artist to locations */}
                {artist &&
                  locationGroups
                    .filter((g) => g.coordinates && !g.location.includes("UAE"))
                    .map((group) => {
                      const isHovered = hoveredLocation === group.location;
                      const hasSelected = group.requests.some((r) => r.id === selectedRequestId);
                      return (
                        <Line
                          key={`line-${group.location}`}
                          from={[artist.coordinates.lng, artist.coordinates.lat]}
                          to={[group.coordinates!.lng, group.coordinates!.lat]}
                          stroke={getHeatColor(group.heatLevel)}
                          strokeWidth={isHovered || hasSelected ? 2.5 : 1.5}
                          strokeOpacity={isHovered || hasSelected ? 0.8 : 0.3}
                          strokeLinecap="round"
                          strokeDasharray="6 4"
                        />
                      );
                    })}

                {/* Heat map markers for request locations */}
                {locationGroups
                  .filter((g) => g.coordinates && !g.location.includes("UAE"))
                  .map((group) => {
                    const isHovered = hoveredLocation === group.location;
                    const hasSelected = group.requests.some((r) => r.id === selectedRequestId);
                    // Size based on value (heat level)
                    const baseSize = 10 + group.heatLevel * 12;
                    const markerSize = isHovered || hasSelected ? baseSize + 4 : baseSize;
                    const heatColor = getHeatColor(group.heatLevel);
                    const glowColor = getHeatGlow(group.heatLevel);

                    return (
                      <Marker
                        key={group.location}
                        coordinates={[group.coordinates!.lng, group.coordinates!.lat]}
                        onMouseEnter={(e) => {
                          setHoveredLocation(group.location);
                          setTooltipPos({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseLeave={() => {
                          setHoveredLocation(null);
                          setTooltipPos(null);
                        }}
                        onClick={() => {
                          if (group.requests.length > 0 && onSelectRequest) {
                            onSelectRequest(group.requests[0]);
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {/* Heat glow effect */}
                        <circle
                          r={markerSize + 12}
                          fill={glowColor}
                          style={{
                            filter: "blur(8px)",
                          }}
                        >
                          {(isHovered || hasSelected) && (
                            <animate
                              attributeName="r"
                              values={`${markerSize + 8};${markerSize + 16};${markerSize + 8}`}
                              dur="1.5s"
                              repeatCount="indefinite"
                            />
                          )}
                        </circle>

                        {/* Outer heat ring */}
                        <circle
                          r={markerSize + 4}
                          fill={heatColor}
                          fillOpacity={0.3}
                        />

                        {/* Main marker */}
                        <circle
                          r={markerSize}
                          fill={heatColor}
                          stroke="hsl(var(--card))"
                          strokeWidth={2}
                          style={{
                            filter:
                              isHovered || hasSelected
                                ? `drop-shadow(0 0 12px ${heatColor})`
                                : `drop-shadow(0 0 4px ${heatColor})`,
                          }}
                        />

                        {/* Request count */}
                        <text
                          textAnchor="middle"
                          y={4}
                          style={{
                            fontFamily: "system-ui",
                            fontSize: markerSize > 14 ? "11px" : "9px",
                            fontWeight: 700,
                            fill: "white",
                          }}
                        >
                          {group.requests.length}
                        </text>
                      </Marker>
                    );
                  })}

                {/* Artist home marker */}
                {artist && (
                  <Marker coordinates={[artist.coordinates.lng, artist.coordinates.lat]}>
                    {/* Pulsing outer ring */}
                    <circle r={24} fill="hsl(var(--primary))" fillOpacity={0.15}>
                      <animate attributeName="r" values="18;28;18" dur="2s" repeatCount="indefinite" />
                      <animate
                        attributeName="fill-opacity"
                        values="0.2;0.05;0.2"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    {/* Outer circle */}
                    <circle
                      r={14}
                      fill="hsl(var(--card))"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      style={{
                        filter: "drop-shadow(0 0 8px hsl(var(--primary)))",
                      }}
                    />
                    {/* Inner dot */}
                    <circle r={6} fill="hsl(var(--primary))" />
                  </Marker>
                )}
              </ZoomableGroup>
            </ComposableMap>

            {/* Tooltip */}
            {hoveredGroup && tooltipPos && (
              <div
                className="pointer-events-none fixed z-50 rounded-lg border border-border bg-card px-4 py-3 shadow-xl"
                style={{
                  left: tooltipPos.x + 16,
                  top: tooltipPos.y - 20,
                }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: getHeatColor(hoveredGroup.heatLevel) }}
                  />
                  <span className="font-semibold text-foreground">{hoveredGroup.location}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-muted-foreground">Distance</span>
                    <span className="text-foreground">
                      {hoveredGroup.distance ? formatDistance(hoveredGroup.distance) : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-muted-foreground">Requests</span>
                    <span className="text-foreground">{hoveredGroup.requests.length}</span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-muted-foreground">Total Value</span>
                    <span
                      className="font-medium"
                      style={{ color: getHeatColor(hoveredGroup.heatLevel) }}
                    >
                      {formatCurrency(hoveredGroup.totalFee)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* International locations indicator */}
            {hasInternational && (
              <div className="absolute right-4 top-4 rounded-lg border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
                <div className="mb-1 flex items-center gap-2 text-xs text-primary">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="font-medium">International</span>
                </div>
                {locationGroups
                  .filter((g) => g.location.includes("UAE") || g.location.includes("Dubai"))
                  .map((g) => (
                    <div
                      key={g.location}
                      className="flex cursor-pointer items-center justify-between gap-4 rounded px-1 py-0.5 text-xs transition-colors hover:bg-muted"
                      onMouseEnter={() => setHoveredLocation(g.location)}
                      onMouseLeave={() => setHoveredLocation(null)}
                      onClick={() => {
                        if (g.requests.length > 0 && onSelectRequest) {
                          onSelectRequest(g.requests[0]);
                        }
                      }}
                    >
                      <span className="text-muted-foreground">{g.location}</span>
                      <span style={{ color: getHeatColor(g.heatLevel) }}>{formatCurrency(g.totalFee)}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Heat Map Legend */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-2 rounded-lg border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <Flame className="h-3.5 w-3.5 text-chart-3" />
                <span>Heat Map: Request Value</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">Low</span>
                <div className="flex h-2 w-24 overflow-hidden rounded-full">
                  <div className="flex-1" style={{ backgroundColor: getHeatColor(0) }} />
                  <div className="flex-1" style={{ backgroundColor: getHeatColor(0.33) }} />
                  <div className="flex-1" style={{ backgroundColor: getHeatColor(0.66) }} />
                  <div className="flex-1" style={{ backgroundColor: getHeatColor(1) }} />
                </div>
                <span className="text-[10px] text-muted-foreground">High</span>
              </div>
              <div className="mt-1 flex items-center gap-3 border-t border-border pt-2">
                <div className="flex items-center gap-1.5">
                  <div className="relative h-4 w-4">
                    <div className="absolute inset-0 rounded-full border-2 border-primary bg-card" />
                    <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">Artist Base</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <Globe className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No location data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Location List */}
      <div className="border-t border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <h3 className="text-sm font-medium text-foreground">Locations by Distance</h3>
          <Badge variant="secondary" className="text-muted-foreground">
            {locationGroups.length} cities
          </Badge>
        </div>
        <ScrollArea className="h-[180px]">
          <div className="divide-y divide-border">
            {locationGroups.map((group, index) => (
              <div
                key={group.location}
                className={`group cursor-pointer px-6 py-3 transition-colors hover:bg-muted/50 ${
                  hoveredLocation === group.location ? "bg-muted/50" : ""
                }`}
                onMouseEnter={() => setHoveredLocation(group.location)}
                onMouseLeave={() => setHoveredLocation(null)}
                onClick={() => {
                  if (group.requests.length > 0 && onSelectRequest) {
                    onSelectRequest(group.requests[0]);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: getHeatColor(group.heatLevel) }}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-medium text-foreground">{group.location}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {group.requests.length} request{group.requests.length !== 1 ? "s" : ""}
                        </span>
                        <span>•</span>
                        <span style={{ color: getHeatColor(group.heatLevel) }}>
                          {formatCurrency(group.totalFee)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {group.distance !== null && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Navigation2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {formatDistance(group.distance)}
                        </span>
                      </div>
                    )}
                    {group.location.includes("UAE") && (
                      <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                        International
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
