"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Calendar } from "lucide-react";
import { BookingStatus } from "@/lib/types";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: BookingStatus | "all";
  onStatusFilterChange: (status: BookingStatus | "all") => void;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by keyword..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-background border-border"
        />
      </div>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as BookingStatus | "all")}>
          <SelectTrigger className="w-[160px] bg-background border-border">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="reject">Reject</SelectItem>
            <SelectItem value="manual_review">Manual Review</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" className="border-border bg-background">
          <Calendar className="h-4 w-4" />
          <span className="sr-only">Filter by date</span>
        </Button>
      </div>
    </div>
  );
}
