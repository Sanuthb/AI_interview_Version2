'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Candidate } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface ResumeViewerProps {
  candidate: Candidate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResumeViewer({ candidate, open, onOpenChange }: ResumeViewerProps) {
  const [activeTab, setActiveTab] = useState("pdf");
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      if (!open || !candidate.id) return;
      setLoadingReport(true);
      try {
        const { data, error } = await supabase
          .from("interview_results")
          .select("*")
          .eq("candidate_id", candidate.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setReportData(data);
        }
      } catch (err) {
        console.error("Error fetching report:", err);
      } finally {
        setLoadingReport(false);
      }
    };

    fetchReport();
  }, [open, candidate.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Details: {candidate.name} ({candidate.usn})</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList>
            <TabsTrigger value="pdf">Resume PDF</TabsTrigger>
            <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="jd-match">JD Match</TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="flex-1 min-h-0 mt-2 border rounded-md bg-muted/20">
            {candidate.resume_url ? (
              <iframe
                src={candidate.resume_url}
                className="w-full h-full rounded-md"
                title={`${candidate.name} Resume`}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No resume uploaded
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai-analysis" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                
                {/* Resume Analysis Section */}
                {candidate.resume_analysis ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Overall Score */}
                      <div className="p-4 border rounded-lg bg-primary/5">
                        <h3 className="font-semibold mb-2">Resume Match Score</h3>
                        <div className="flex items-end gap-2">
                          <span className="text-4xl font-bold text-primary">
                            {candidate.resume_analysis.overallScore || candidate.resume_score || 0}%
                          </span>
                          <span className="text-sm font-medium text-muted-foreground mb-1">
                             {candidate.resume_analysis.overallRating}
                          </span>
                        </div>
                      </div>

                      {/* Detailed Scores */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Skills Match</span>
                            <span className="font-medium">{candidate.resume_analysis.skillsMatchScore}%</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500" 
                              style={{ width: `${candidate.resume_analysis.skillsMatchScore}%` }} 
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Project Relevance</span>
                            <span className="font-medium">{candidate.resume_analysis.projectRelevanceScore}%</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500" 
                              style={{ width: `${candidate.resume_analysis.projectRelevanceScore}%` }} 
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Experience Suitability</span>
                            <span className="font-medium">{candidate.resume_analysis.experienceSuitabilityScore}%</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500" 
                              style={{ width: `${candidate.resume_analysis.experienceSuitabilityScore}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg bg-green-50/50 dark:bg-green-900/20">
                        <h3 className="font-semibold mb-2 text-green-700 dark:text-green-400">Strengths</h3>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {candidate.resume_analysis.strengths?.length > 0 ? (
                            candidate.resume_analysis.strengths.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))
                          ) : (
                            <li className="text-muted-foreground">No strengths listed.</li>
                          )}
                        </ul>
                      </div>
                      
                      <div className="p-4 border rounded-lg bg-red-50/50 dark:bg-red-900/20">
                        <h3 className="font-semibold mb-2 text-red-700 dark:text-red-400">Weaknesses</h3>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {candidate.resume_analysis.weaknesses?.length > 0 ? (
                            candidate.resume_analysis.weaknesses.map((w: string, i: number) => (
                              <li key={i}>{w}</li>
                            ))
                          ) : (
                            <li className="text-muted-foreground">No weaknesses listed.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border rounded-lg bg-muted text-center text-muted-foreground">
                    <p>No detailed resume analysis available.</p>
                    <p className="text-xs mt-1">
                      (Ask the candidate to re-upload their resume to generate this analysis)
                    </p>
                  </div>
                )}

                {/* Separator for Interview Results */}
                <div className="border-t my-4 py-4">
                   <h3 className="text-lg font-bold mb-4">Post-Interview Analysis</h3>
                    {reportData ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 border rounded-lg bg-blue-50/50">
                            <h4 className="text-xs font-semibold text-blue-700 uppercase mb-1">Communication</h4>
                            <div className="text-2xl font-bold">{reportData.communication_score}/100</div>
                          </div>
                          <div className="p-4 border rounded-lg bg-green-50/50">
                            <h4 className="text-xs font-semibold text-green-700 uppercase mb-1">Skills</h4>
                            <div className="text-2xl font-bold">{reportData.skills_score}/100</div>
                          </div>
                          <div className="p-4 border rounded-lg bg-purple-50/50">
                            <h4 className="text-xs font-semibold text-purple-700 uppercase mb-1">Knowledge</h4>
                            <div className="text-2xl font-bold">{reportData.knowledge_score}/100</div>
                          </div>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <h3 className="font-semibold mb-2">Interview Strengths</h3>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            {reportData.report?.strengths?.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <h3 className="font-semibold mb-2">Areas for Improvement</h3>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            {reportData.report?.weaknesses?.map((w: string, i: number) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          {loadingReport ? "Loading interview report..." : "Interview analysis will appear here after completion."}
                        </p>
                      </div>
                    )}
                </div>

              </div>
            </ScrollArea>
          </TabsContent>

           <TabsContent value="jd-match" className="flex-1 min-h-0 mt-2">
             <ScrollArea className="h-full">
               <div className="p-4 space-y-4">
                {reportData ? (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-primary/5">
                      <h3 className="font-semibold mb-2">Hiring Recommendation</h3>
                      <div className="text-xl font-bold text-primary">
                        {reportData.report?.hiringRecommendation}
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">AI Summary</h3>
                      <p className="text-sm leading-relaxed">
                        {reportData.summary}
                      </p>
                    </div>

                    {reportData.report?.riskFlags?.length > 0 && (
                      <div className="p-4 border border-red-200 rounded-lg bg-red-50/50">
                        <h3 className="font-semibold text-red-800 mb-2">Risk Flags</h3>
                        <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                          {reportData.report.riskFlags.map((flag: string, i: number) => (
                            <li key={i}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground py-20">
                    {loadingReport ? "Loading matching data..." : "JD Matching will be available after the interview."}
                  </div>
                )}
               </div>
             </ScrollArea>
           </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
