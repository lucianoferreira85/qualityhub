import { Badge } from "./badge";
import {
  getStatusColor,
  getStatusLabel,
  getSeverityColor,
  getSeverityLabel,
  getOriginLabel,
  getDocumentTypeColor,
  getDocumentTypeLabel,
  getProcessStatusColor,
  getProcessStatusLabel,
  getConclusionColor,
  getConclusionLabel,
  getClassificationColor,
  getClassificationLabel,
} from "@/lib/utils";

type BadgeType =
  | "status"
  | "severity"
  | "origin"
  | "documentType"
  | "processStatus"
  | "conclusion"
  | "classification";

interface StatusBadgeProps {
  status: string;
  type?: BadgeType;
  className?: string;
}

function getColorAndLabel(
  status: string,
  type: BadgeType
): { color: string; label: string } {
  switch (type) {
    case "severity":
      return { color: getSeverityColor(status), label: getSeverityLabel(status) };
    case "origin":
      return { color: "bg-info-bg text-info-fg", label: getOriginLabel(status) };
    case "documentType":
      return { color: getDocumentTypeColor(status), label: getDocumentTypeLabel(status) };
    case "processStatus":
      return { color: getProcessStatusColor(status), label: getProcessStatusLabel(status) };
    case "conclusion":
      return { color: getConclusionColor(status), label: getConclusionLabel(status) };
    case "classification":
      return { color: getClassificationColor(status), label: getClassificationLabel(status) };
    case "status":
    default:
      return { color: getStatusColor(status), label: getStatusLabel(status) };
  }
}

function StatusBadge({ status, type = "status", className }: StatusBadgeProps) {
  const { color, label } = getColorAndLabel(status, type);

  return (
    <Badge variant={color} className={className}>
      {label}
    </Badge>
  );
}

export { StatusBadge };
export type { StatusBadgeProps };
