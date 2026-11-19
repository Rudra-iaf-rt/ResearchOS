import {
  BookOpen,
  Briefcase,
  ChartNoAxesCombined,
  ClipboardCheck,
  FlaskConical,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import type { ResearchMode } from "@/types";

export const researchModeIcons: Record<ResearchMode, LucideIcon> = {
  reading: BookOpen,
  writing: PenLine,
  experiment: FlaskConical,
  analysis: ChartNoAxesCombined,
  review: ClipboardCheck,
  admin: Briefcase,
};
