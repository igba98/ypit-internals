import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"
import { PipelineStage, PIPELINE_STAGES } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "TZS") {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "MMM d, yyyy")
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function getPipelineStageLabel(stage: PipelineStage) {
  const labels: Record<PipelineStage, string> = {
    [PIPELINE_STAGES.LEAD]: "Lead",
    [PIPELINE_STAGES.COUNSELING]: "Counseling",
    [PIPELINE_STAGES.PAYMENT_PENDING]: "Payment Pending",
    [PIPELINE_STAGES.PAYMENT_CONFIRMED]: "Payment Confirmed",
    [PIPELINE_STAGES.APPLICATION_SUBMITTED]: "Application Submitted",
    [PIPELINE_STAGES.UNIVERSITY_ACCEPTED]: "University Accepted",
    [PIPELINE_STAGES.TRAVEL_PLANNING]: "Travel Planning",
    [PIPELINE_STAGES.TRAVELLED]: "Travelled",
    [PIPELINE_STAGES.MONITORING]: "Monitoring",
  };
  return labels[stage] || stage;
}

export function truncate(str: string, len: number) {
  if (str.length <= len) return str;
  return str.slice(0, len) + "...";
}
