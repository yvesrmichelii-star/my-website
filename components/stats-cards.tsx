"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle, Inbox } from "lucide-react";

interface StatsCardsProps {
  total: number;
  review: number;
  reject: number;
  manualReview: number;
}

export function StatsCards({ total, review, reject, manualReview }: StatsCardsProps) {
  const stats = [
    {
      label: "Total Requests",
      value: total,
      icon: Inbox,
      className: "text-foreground",
      bgClassName: "bg-muted",
    },
    {
      label: "Ready for Review",
      value: review,
      icon: CheckCircle,
      className: "text-success",
      bgClassName: "bg-success/15",
    },
    {
      label: "Rejected",
      value: reject,
      icon: XCircle,
      className: "text-destructive",
      bgClassName: "bg-destructive/15",
    },
    {
      label: "Manual Review",
      value: manualReview,
      icon: AlertCircle,
      className: "text-warning",
      bgClassName: "bg-warning/15",
    },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="flex items-center gap-3 p-3">
              <div className={`rounded-lg p-2 ${stat.bgClassName}`}>
                <Icon className={`h-4 w-4 ${stat.className}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
