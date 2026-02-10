"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  TrendingUp,
  Brain,
  MessageSquare,
  Target,
  FileSearch,
  Lightbulb,
} from "lucide-react";
import axios from "axios";

interface ScoreRingProps {
  value: number;
  label: string;
  size?: "sm" | "md" | "lg";
}

function ScoreRing({ value, label, size = "md" }: ScoreRingProps) {
  const radius = size === "lg" ? 45 : size === "md" ? 35 : 25;
  const stroke = size === "lg" ? 8 : size === "md" ? 6 : 4;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const color =
    value >= 80 ? "text-emerald-500" : 
    value >= 60 ? "text-green-500" : 
    value >= 40 ? "text-amber-500" : "text-red-500";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle stroke="rgba(0,0,0,0.1)" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            className={`${color} transition-all duration-1000 ease-out`}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <span className={`absolute ${size === "lg" ? "text-2xl" : "text-lg"} font-bold`}>
          {value}
        </span>
      </div>
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">
        {label}
      </span>
    </div>
  );
}

interface IntelligenceReportDialogProps {
  candidateId: string;
  candidateName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IntelligenceReportDialog({
  candidateId,
  candidateName,
  open,
  onOpenChange,
}: IntelligenceReportDialogProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && candidateId) {
      const fetchReport = async () => {
        setLoading(true);
        try {
          const response = await axios.post("/api/feedbackanalysis", { candidateId });
          // Get the latest result
          const latestResult = response.data.data?.[0];
          setReport(latestResult);
        } catch (error) {
          console.error("Error fetching report:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchReport();
    }
  }, [open, candidateId]);

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "Strong Hire": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Hire": return "bg-green-100 text-green-700 border-green-200";
      case "Weak Hire": return "bg-amber-100 text-amber-700 border-amber-200";
      case "No Hire": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const data = report?.report;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold">{candidateName}</DialogTitle>
              <p className="text-muted-foreground">{report?.interviews?.title || "Intelligence Analysis"}</p>
            </div>
            {data?.hiringRecommendation && (
              <Badge className={getRecommendationColor(data.hiringRecommendation)}>
                {data.hiringRecommendation}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-20 text-center">Loading Intelligence Report...</div>
        ) : !data ? (
          <div className="py-20 text-center text-muted-foreground">No report generated yet.</div>
        ) : (
          <div className="py-6">
            <Tabs defaultValue="scorecard">
              <TabsList className="mb-6">
                <TabsTrigger value="scorecard"><TrendingUp className="w-4 h-4 mr-2" /> Scorecard</TabsTrigger>
                <TabsTrigger value="coaching"><Brain className="w-4 h-4 mr-2" /> AI Coaching</TabsTrigger>
                <TabsTrigger value="strategy"><Target className="w-4 h-4 mr-2" /> Strategy</TabsTrigger>
              </TabsList>

              <TabsContent value="scorecard" className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ScoreRing value={data.finalScore} label="Final" size="lg" />
                  <ScoreRing value={data.skillsScore} label="Technical" size="lg" />
                  <ScoreRing value={data.knowledgeScore} label="Knowledge" size="lg" />
                  <ScoreRing value={data.communicationScore} label="Comm." size="lg" />
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-8">
                  <div className="space-y-3">
                    <h4 className="font-bold text-emerald-600 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" /> Key Strengths
                    </h4>
                    <div className="space-y-2">
                      {data.strengths?.map((s: string, i: number) => (
                        <div key={i} className="p-3 bg-emerald-50 rounded border border-emerald-100 text-sm">{s}</div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-bold text-red-600 flex items-center">
                      <XCircle className="w-4 h-4 mr-2" /> Areas for Growth
                    </h4>
                    <div className="space-y-2">
                      {data.weaknesses?.map((w: string, i: number) => (
                        <div key={i} className="p-3 bg-red-50 rounded border border-red-100 text-sm">{w}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="coaching" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-50 rounded-xl border">
                    <h4 className="font-bold mb-3 flex items-center"><MessageSquare className="w-4 h-4 mr-2 text-primary" /> Verbal Delivery</h4>
                    <ul className="space-y-2 text-sm">
                      {(data.communication_coaching?.verbal_delivery || []).map((t: string, i: number) => <li key={i}>• {t}</li>)}
                    </ul>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border">
                    <h4 className="font-bold mb-3 flex items-center"><Lightbulb className="w-4 h-4 mr-2 text-primary" /> Structuring</h4>
                    <ul className="space-y-2 text-sm">
                      {(data.communication_coaching?.structuring_answers || []).map((t: string, i: number) => <li key={i}>• {t}</li>)}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="strategy" className="space-y-6">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <h4 className="font-bold mb-3 flex items-center"><FileSearch className="w-4 h-4 mr-2 text-primary" /> Resume vs Reality</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="font-bold text-emerald-600">Verified:</span>
                      <ul className="mt-1 space-y-1">{(data.resume_vs_reality?.verified_claims || []).map((c: string, i: number) => <li key={i}>• {c}</li>)}</ul>
                    </div>
                    <div>
                      <span className="font-bold text-amber-600">Exaggerated:</span>
                      <ul className="mt-1 space-y-1">{(data.resume_vs_reality?.exaggerated_claims || []).map((c: string, i: number) => <li key={i}>• {c}</li>)}</ul>
                    </div>
                    <div>
                      <span className="font-bold text-red-600">Gaps:</span>
                      <ul className="mt-1 space-y-1">{(data.resume_vs_reality?.missing_skills || []).map((c: string, i: number) => <li key={i}>• {c}</li>)}</ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
