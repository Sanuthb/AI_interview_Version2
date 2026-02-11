"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Brain,
  MessageSquare,
  Target,
  FileSearch,
  Lightbulb,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import axios from "axios";

// Type definitions
interface Interview {
  id: string;
  title: string;
  interview_type: string;
}

interface Report {
  summary: string;
  riskFlags: string[];
  strengths: string[];
  weaknesses: string[];
  finalScore: number;
  skillsScore: number;
  knowledgeScore: number;
  communicationScore: number;
  hiringRecommendation: "Strong Hire" | "Hire" | "Weak Hire" | "No Hire";
  communication_coaching?: {
    verbal_delivery: string[];
    structuring_answers: string[];
  };
  resume_vs_reality?: {
    verified_claims: string[];
    exaggerated_claims: string[];
    missing_skills: string[];
  };
  strategic_recommendations?: {
    resume_edits: string[];
    study_focus: string[];
  };
  actionable_tips_and_tricks?: {
    immediate_fixes: string[];
    interview_hacks: string[];
  };
}

interface InterviewResult {
  id: string;
  report: Report;
  created_at: string;
  updated_at: string;
  interviews: Interview;
}

interface DeepAnalysis {
  id: string;
  analysis: {
    resume_data_extraction: any;
    performance_metrics: { metric: string; score: number; description: string }[];
    feedback_analysis: {
      summary: string;
      overall_rating: string;
      key_observations: string[];
    };
    overall_assessment: {
      hiring_status: string;
      match_score: number;
      verdict_summary: string;
    };
    skill_analysis: {
      strengths: string[];
      weaknesses: string[];
      soft_skills: string[];
    };
    resume_vs_reality: {
      verified_claims: string[];
      exaggerated_claims: string[];
      missing_skills: string[];
    };
    strategic_recommendations: {
      resume_edits: string[];
      role_fit: string[];
      study_focus: string[];
    };
    actionable_tips_and_tricks: {
      immediate_fixes: string[];
      interview_hacks: string[];
    };
    skilltips?: { // Made optional
      coding_tips: string[];
      system_design_tips: string[];
      behavioral_tips: string[];
    };
    communication_coaching?: { // Made optional
      verbal_delivery: string[];
      structuring_answers: string[];
    };
  };
  created_at: string;
}

function ScoreRing({
  value,
  label,
  size = "md",
}: {
  value: number;
  label: string;
  size?: "sm" | "md" | "lg";
}) {
  const radius = size === "lg" ? 45 : size === "md" ? 35 : 25;
  const stroke = size === "lg" ? 8 : size === "md" ? 6 : 4;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const color =
    value >= 80
      ? "text-emerald-500"
      : value >= 60
        ? "text-green-500"
        : value >= 40
          ? "text-amber-500"
          : "text-red-500";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          <circle
            stroke="rgba(0,0,0,0.1)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
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
        <span
          className={`absolute ${size === "lg" ? "text-2xl" : "text-lg"
            } font-bold text-gray-900`}
        >
          {value}
        </span>
      </div>
      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center max-w-[80px]">
        {label}
      </span>
    </div>
  );
}

function Page() {
  const [selectedReport, setSelectedReport] = useState<InterviewResult | null>(
    null
  );
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysis | null>(null);
  const [results, setResults] = useState<InterviewResult[]>([]);
  const [allAnalyses, setAllAnalyses] = useState<DeepAnalysis[]>([]);

  const { candidateId, loading } = useAuth();

  const getRecommendationColor = (
    recommendation: Report["hiringRecommendation"]
  ): string => {
    switch (recommendation) {
      case "Strong Hire":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "Hire":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Weak Hire":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "No Hire":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  };

  useEffect(() => {
    if (!loading && candidateId) {
      const fetchData = async () => {
        try {
          const response = await axios.post(`/api/feedbackanalysis`, {
            candidateId,
          });
          setResults(response.data.data);
          setAllAnalyses(response.data.analysis);
        } catch (err) {
          console.error("Error fetching feedback:", err);
        }
      };
      fetchData();
    }
  }, [loading, candidateId]);

  const handleOpenReport = (report: InterviewResult) => {
    setSelectedReport(report);
    // Find the analysis that matches this interview if possible, or use the latest
    const analysis = allAnalyses.find(a => a.created_at >= report.created_at) || allAnalyses[0];
    setDeepAnalysis(analysis || null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="relative overflow-hidden p-8 rounded-3xl bg-white border border-gray-200 shadow-lg">
          <div className="absolute top-0 right-0 p-8 opacity-5 blur-2xl bg-blue-400 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2" />
          <h1 className="text-4xl font-black text-blue-600 mb-2 tracking-tight">
            Interview Intelligence Dashboard
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Analyze your interview performance through AI-driven insights, communication coaching, and strategic career recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((item, index) => (
            <Dialog key={index}>
              <DialogTrigger asChild>
                <Card
                  className="group relative cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] bg-white border-2 border-gray-200 hover:border-blue-400 shadow-md hover:shadow-lg"
                  onClick={() => handleOpenReport(item)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {item.interviews.title}
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                          {item.interviews.interview_type} • {new Date(item.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge className={getRecommendationColor(item.report.hiringRecommendation)}>
                        {item.report.hiringRecommendation}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center py-4 border-t border-gray-200">
                      <ScoreRing value={item.report.finalScore} label="Overall" size="sm" />
                      <div className="h-8 w-px bg-gray-300" />
                      <ScoreRing value={item.report.skillsScore} label="Technical" size="sm" />
                      <div className="h-8 w-px bg-gray-300" />
                      <ScoreRing value={item.report.communicationScore} label="Communication" size="sm" />
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>

              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white border-gray-200 text-gray-900 p-0 shadow-xl">
                <DialogHeader className="p-8 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <DialogTitle className="text-3xl font-black tracking-tight mb-1">
                        {selectedReport?.interviews.title}
                      </DialogTitle>
                      <p className="text-gray-600 font-medium">
                        Detailed Hiring Analysis & Career Coaching Report
                      </p>
                    </div>
                    {selectedReport && (
                      <Badge className={`${getRecommendationColor(selectedReport.report.hiringRecommendation)} text-base py-2 px-6 rounded-full`}>
                        {selectedReport.report.hiringRecommendation}
                      </Badge>
                    )}
                  </div>
                </DialogHeader>

                <div className="p-8">
                  <Tabs defaultValue="scorecard" className="space-y-8">
                    <TabsList className="bg-gray-100 border border-gray-200 p-1">
                      <TabsTrigger value="scorecard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
                        <TrendingUp className="w-4 h-4 mr-2" /> Scorecard
                      </TabsTrigger>
                      <TabsTrigger value="coaching" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
                        <Brain className="w-4 h-4 mr-2" /> AI Coaching
                      </TabsTrigger>
                      <TabsTrigger value="strategy" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
                        <Target className="w-4 h-4 mr-2" /> Strategy
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="scorecard" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <ScoreRing value={selectedReport?.report.finalScore || 0} label="Final Score" size="lg" />
                        <ScoreRing value={selectedReport?.report.skillsScore || 0} label="Tech Skills" size="lg" />
                        <ScoreRing value={selectedReport?.report.knowledgeScore || 0} label="Core Knowledge" size="lg" />
                        <ScoreRing value={selectedReport?.report.communicationScore || 0} label="Communication" size="lg" />
                      </div>

                      <div className="grid md:grid-cols-2 gap-8 mt-12">
                        <section className="space-y-4">
                          <h3 className="text-xl font-bold flex items-center text-emerald-400">
                            <CheckCircle className="w-6 h-6 mr-3" /> Core Strengths
                          </h3>
                          <div className="grid gap-3">
                            {(selectedReport?.report?.strengths || []).map((s, i) => (
                              <div key={i} className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-gray-700">
                                {s}
                              </div>
                            ))}
                          </div>
                        </section>

                        <section className="space-y-4">
                          <h3 className="text-xl font-bold flex items-center text-red-400">
                            <XCircle className="w-6 h-6 mr-3" /> Areas for Growth
                          </h3>
                          <div className="grid gap-3">
                            {(selectedReport?.report?.weaknesses || []).map((w, i) => (
                              <div key={i} className="p-4 rounded-xl bg-red-50 border border-red-200 text-gray-700">
                                {w}
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>
                    </TabsContent>

                    <TabsContent value="coaching" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {(deepAnalysis?.analysis?.communication_coaching || selectedReport?.report?.communication_coaching) ? (
                        <>
                          <div className="grid md:grid-cols-2 gap-8">
                            <Card className="bg-gray-50 border-gray-200">
                              <CardHeader>
                                <CardTitle className="flex items-center text-blue-600">
                                  <MessageSquare className="w-5 h-5 mr-3" /> Verbal Delivery Coaching
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {(deepAnalysis?.analysis?.communication_coaching?.verbal_delivery || selectedReport?.report?.communication_coaching?.verbal_delivery || []).map((tip, i) => (
                                  <li key={i} className="text-gray-700 list-none flex items-start">
                                    <span className="text-blue-600 mr-2">•</span> {tip}
                                  </li>
                                ))}
                              </CardContent>
                            </Card>

                            <Card className="bg-gray-50 border-gray-200">
                              <CardHeader>
                                <CardTitle className="flex items-center text-blue-600">
                                  <Lightbulb className="w-5 h-5 mr-3" /> Structuring Answers
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {(deepAnalysis?.analysis?.communication_coaching?.structuring_answers || selectedReport?.report?.communication_coaching?.structuring_answers || []).map((tip, i) => (
                                  <li key={i} className="text-gray-700 list-none flex items-start">
                                    <span className="text-blue-600 mr-2">•</span> {tip}
                                  </li>
                                ))}
                              </CardContent>
                            </Card>
                          </div>

                          <Card className="bg-gray-50 border-gray-200">
                            <CardHeader>
                              <CardTitle className="flex items-center text-blue-600">
                                <Brain className="w-5 h-5 mr-3" /> Interview Tactics & Hacks
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-sm font-bold text-gray-600 uppercase mb-3">Immediate Fixes</h4>
                                {(deepAnalysis?.analysis?.actionable_tips_and_tricks?.immediate_fixes || []).length > 0 
                                  ? deepAnalysis?.analysis?.actionable_tips_and_tricks?.immediate_fixes.map((tip, i) => (
                                    <p key={i} className="text-gray-700 mb-2">• {tip}</p>
                                  ))
                                  : <p className="text-gray-500 text-sm">Focus on technical clarity and concise delivery.</p>}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-gray-600 uppercase mb-3">Professional Impact</h4>
                                {(deepAnalysis?.analysis?.actionable_tips_and_tricks?.interview_hacks || []).length > 0
                                  ? deepAnalysis?.analysis?.actionable_tips_and_tricks?.interview_hacks.map((tip, i) => (
                                    <p key={i} className="text-gray-700 mb-2">• {tip}</p>
                                  ))
                                  : <p className="text-gray-500 text-sm">Build rapport by asking thoughtful questions about the role.</p>}
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      ) : (
                        <div className="p-12 text-center text-gray-500 border border-dashed border-gray-300 rounded-3xl bg-gray-50">
                          Deep-dive coaching analysis is being generated...
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="strategy" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {(deepAnalysis?.analysis?.resume_vs_reality || selectedReport?.report?.resume_vs_reality) ? (
                        <div className="space-y-8">
                          <Card className="bg-white border-gray-200 overflow-hidden">
                            <div className="bg-blue-50 p-4 border-b border-gray-200">
                              <h3 className="font-bold flex items-center text-blue-600">
                                <FileSearch className="w-5 h-5 mr-3" /> Resume vs Reality Analysis
                              </h3>
                            </div>
                            <CardContent className="p-6 grid md:grid-cols-3 gap-8">
                              <div>
                                <h4 className="text-emerald-400 text-xs font-black uppercase mb-3">Verified Claims</h4>
                                {(deepAnalysis?.analysis?.resume_vs_reality?.verified_claims || selectedReport?.report?.resume_vs_reality?.verified_claims || []).map((c, i) => (
                                  <p key={i} className="text-gray-700 text-sm mb-2 decoration-emerald-500 underline-offset-4 underline">• {c}</p>
                                ))}
                              </div>
                              <div>
                                <h4 className="text-amber-400 text-xs font-black uppercase mb-3">Exaggerations</h4>
                                {(deepAnalysis?.analysis?.resume_vs_reality?.exaggerated_claims || selectedReport?.report?.resume_vs_reality?.exaggerated_claims || []).map((c, i) => (
                                  <p key={i} className="text-gray-700 text-sm mb-2">• {c}</p>
                                ))}
                              </div>
                              <div>
                                <h4 className="text-red-400 text-xs font-black uppercase mb-3">Gap Missing Skills</h4>
                                {(deepAnalysis?.analysis?.resume_vs_reality?.missing_skills || selectedReport?.report?.resume_vs_reality?.missing_skills || []).map((c, i) => (
                                  <p key={i} className="text-gray-700 text-sm mb-2">• {c}</p>
                                ))}
                              </div>
                            </CardContent>
                          </Card>

                          <div className="grid md:grid-cols-2 gap-8">
                            <section className="space-y-4">
                              <h3 className="text-xl font-bold flex items-center text-blue-600">
                                📝 Recommended Resume Edits
                              </h3>
                              <div className="grid gap-3">
                                {(deepAnalysis?.analysis?.strategic_recommendations?.resume_edits || selectedReport?.report?.strategic_recommendations?.resume_edits || []).map((edit, i) => (
                                  <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center">
                                    <AlertCircle className="w-4 h-4 text-blue-600 mr-3 flex-shrink-0" />
                                    <span className="text-gray-700 text-sm">{edit}</span>
                                  </div>
                                ))}
                              </div>
                            </section>

                            <section className="space-y-4">
                              <h3 className="text-xl font-bold flex items-center text-blue-600">
                                📚 High Priority Study Topics
                              </h3>
                              <div className="grid gap-3">
                                {(deepAnalysis?.analysis?.strategic_recommendations?.study_focus || selectedReport?.report?.strategic_recommendations?.study_focus || []).map((topic, i) => (
                                  <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center">
                                    <Target className="w-4 h-4 text-blue-600 mr-3 flex-shrink-0" />
                                    <span className="text-gray-700 text-sm">{topic}</span>
                                  </div>
                                ))}
                              </div>
                            </section>
                          </div>
                        </div>
                      ) : (
                        <div className="p-12 text-center text-gray-500 border border-dashed border-gray-300 rounded-3xl bg-gray-50">
                          Strategic strategy analysis is being generated...
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Page;
