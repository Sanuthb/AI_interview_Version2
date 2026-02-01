"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
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
  hiringRecommendation: "Strong Hire" | "Hire" | "No Hire";
}

interface InterviewResult {
  id: string;
  report: Report;
  created_at: string;
  updated_at: string;
  interviews: Interview;
}

type RecommendationColor = {
  [key in Report["hiringRecommendation"]]: string;
};

function Page() {
  const [selectedReport, setSelectedReport] = useState<InterviewResult | null>(
    null
  );
  const [data, setData] = useState<InterviewResult[]>([]);

  const { user, candidateId, loading } = useAuth();
  console.log(candidateId);

  const getRecommendationColor = (
    recommendation: Report["hiringRecommendation"]
  ): string => {
    switch (recommendation) {
      case "Strong Hire":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/50";
      case "Hire":
        return "bg-green-500/20 text-green-300 border-green-500/50";
      case "No Hire":
        return "bg-red-500/20 text-red-300 border-red-500/50";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/50";
    }
  };

  useEffect(() => {
    if (!loading && candidateId) {
      const fetchReports = async () => {
        const response = await axios.post(`/api/feedbackanalysis`, {
          candidateId,
        });
        console.log(response.data);

        setData(response.data.data);
      };
      fetchReports();
    }
  }, [loading, candidateId]);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-green-400";
    if (score >= 40) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-50 mb-2">
            Interview Reports
          </h1>
          <p className="text-slate-400">
            Review candidate assessments and hiring recommendations
          </p>
        </div>

        <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
          {data.map((item: InterviewResult, index: number) => (
            <Dialog key={index}>
              <DialogTrigger asChild>
                <Card
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-slate-800/50 border-slate-700 hover:border-slate-600"
                  onClick={() => setSelectedReport(item)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-slate-50">
                        {item.interviews.title}
                      </CardTitle>
                      <Badge
                        className={`${getRecommendationColor(
                          item.report.hiringRecommendation
                        )} text-xs`}
                      >
                        {item.report.hiringRecommendation}
                      </Badge>
                    </div>
                    <CardDescription className="text-slate-400">
                      {item.interviews.interview_type} Interview
                    </CardDescription>
                    <div className="flex gap-4 mt-4 pt-4 border-t border-slate-700">
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${getScoreColor(
                            item.report.finalScore
                          )}`}
                        >
                          {item.report.finalScore}
                        </div>
                        <div className="text-xs text-slate-500">
                          Final Score
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${getScoreColor(
                            item.report.skillsScore
                          )}`}
                        >
                          {item.report.skillsScore}
                        </div>
                        <div className="text-xs text-slate-500">Skills</div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${getScoreColor(
                            item.report.communicationScore
                          )}`}
                        >
                          {item.report.communicationScore}
                        </div>
                        <div className="text-xs text-slate-500">
                          Communication
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </DialogTrigger>

              <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 p-0 gap-0">
                {selectedReport && (
                  <div className="p-4 sm:p-6 md:p-8">
                    <Card className="shadow-2xl border-0 bg-gradient-to-br from-slate-800/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl border-slate-700/50">
                      <CardHeader className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md p-4 sm:p-6 md:p-8 rounded-t-lg">
                        <div className="flex justify-between gap-4 sm:gap-6">
                          <div className="space-y-2 sm:space-y-3">
                            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-50 tracking-tight break-words">
                              {selectedReport.interviews.title}
                            </CardTitle>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm">
                              <CardDescription className="text-slate-300 font-semibold">
                                {selectedReport.interviews.interview_type}{" "}
                                Interview
                              </CardDescription>
                            </div>
                          </div>

                          <Badge
                            className={`${getRecommendationColor(
                              selectedReport.report.hiringRecommendation
                            )} px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-bold flex items-center justify-center rounded-xl border backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 w-full sm:w-fit`}
                          >
                            {selectedReport.report.hiringRecommendation}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 sm:p-6 md:p-8 lg:p-10 space-y-6 sm:space-y-8">
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                          {[
                            {
                              label: "Final Score",
                              value: selectedReport.report.finalScore,
                              icon: "🎯",
                            },
                            {
                              label: "Skills",
                              value: selectedReport.report.skillsScore,
                              icon: "⚡",
                            },
                            {
                              label: "Knowledge",
                              value: selectedReport.report.knowledgeScore,
                              icon: "🧠",
                            },
                            {
                              label: "Communication",
                              value: selectedReport.report.communicationScore,
                              icon: "💬",
                            },
                          ].map(
                            (item: {
                              label: string;
                              value: number;
                              icon: string;
                            }) => (
                              <div
                                key={item.label}
                                className="group relative p-4 sm:p-6 md:p-8 bg-gradient-to-b from-slate-900/70 to-slate-950/70 backdrop-blur-md rounded-xl sm:rounded-2xl border border-slate-700/50 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-slate-900/50 transition-all duration-500 hover:-translate-y-1"
                              >
                                <div className="relative space-y-2 sm:space-y-3">
                                  <div className="text-2xl sm:text-3xl md:text-4xl">
                                    {item.icon}
                                  </div>
                                  <p className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider">
                                    {item.label}
                                  </p>
                                  <p
                                    className={`text-3xl sm:text-4xl md:text-5xl font-black ${getScoreColor(
                                      item.value
                                    )} drop-shadow-2xl`}
                                  >
                                    {item.value}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>

                        <div className=" gap-6 md:gap-10">
                          <section className="space-y-3 sm:space-y-4 mt-2">
                            <h3 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-3">
                              📋 Summary
                            </h3>
                            <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900/60 to-slate-950/60 backdrop-blur-md rounded-xl sm:rounded-2xl border border-slate-700/50">
                              <p className="text-slate-200 leading-relaxed text-sm sm:text-base">
                                {selectedReport.report.summary}
                              </p>
                            </div>
                          </section>

                          <section className="space-y-3 sm:space-y-4 mt-2">
                            <h3 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-3">
                              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-emerald-400 flex-shrink-0" />
                              Strengths
                            </h3>
                            <div className="space-y-2 sm:space-y-3">
                              {selectedReport.report.strengths.map(
                                (strength: string, index: number) => (
                                  <div
                                    key={index}
                                    className="group p-4 sm:p-5 bg-gradient-to-r from-emerald-500/5 via-transparent to-slate-900/50 backdrop-blur-md rounded-lg sm:rounded-xl border border-emerald-500/20 hover:border-emerald-400/40 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-500 flex gap-3"
                                  >
                                    <div className="w-1.5 sm:w-2 h-10 sm:h-12 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-full shadow-lg flex-shrink-0" />
                                    <p className="text-slate-200 text-xs sm:text-sm md:text-base leading-relaxed group-hover:text-emerald-300 transition-colors">
                                      {strength}
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </section>

                          <section className="space-y-6 mt-2">
                            <div>
                              <h3 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-3 mb-3 sm:mb-4">
                                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-red-400 flex-shrink-0" />
                                Weaknesses
                              </h3>
                              <div className="space-y-2 sm:space-y-3">
                                {selectedReport.report.weaknesses.map(
                                  (weakness: string, index: number) => (
                                    <div
                                      key={index}
                                      className="group p-4 sm:p-5 bg-gradient-to-r from-red-500/5 via-transparent to-slate-900/50 backdrop-blur-md rounded-lg sm:rounded-xl border border-red-500/20 hover:border-red-400/40 hover:shadow-xl hover:shadow-red-500/20 transition-all duration-500 flex gap-3"
                                    >
                                      <div className="w-1.5 sm:w-2 h-10 sm:h-12 bg-gradient-to-b from-red-400 to-red-500 rounded-full shadow-lg flex-shrink-0" />
                                      <p className="text-slate-200 text-xs sm:text-sm md:text-base leading-relaxed group-hover:text-red-300 transition-colors">
                                        {weakness}
                                      </p>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>

                            <div>
                              <h3 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-3 mb-3 sm:mb-4">
                                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-amber-400 flex-shrink-0" />
                                Risk Flags
                              </h3>
                              <div className="space-y-2 sm:space-y-3">
                                {selectedReport.report.riskFlags.map(
                                  (flag: string, index: number) => (
                                    <div
                                      key={index}
                                      className="group p-4 sm:p-5 bg-gradient-to-r from-amber-500/5 via-transparent to-slate-900/50 backdrop-blur-md rounded-lg sm:rounded-xl border border-amber-500/20 hover:border-amber-400/40 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-500 flex gap-3"
                                    >
                                      <div className="w-1.5 sm:w-2 h-10 sm:h-12 bg-gradient-to-b from-amber-400 to-amber-500 rounded-full shadow-lg flex-shrink-0" />
                                      <p className="text-slate-200 text-xs sm:text-sm md:text-base leading-relaxed group-hover:text-amber-300 transition-colors">
                                        {flag}
                                      </p>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </section>
                        </div>

                        {/* <footer className="pt-6 sm:pt-8 border-t border-slate-700/50 text-xs sm:text-sm text-slate-500 space-y-2 font-mono bg-slate-950/30 p-4 sm:p-6 rounded-lg sm:rounded-xl">
                          <p className="break-all flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="text-slate-400 font-semibold flex-shrink-0">
                              Report ID:
                            </span>
                            <span className="font-mono text-xs">
                              {selectedReport.id}
                            </span>
                          </p>
                          <p className="break-all flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="text-slate-400 font-semibold flex-shrink-0">
                              Interview ID:
                            </span>
                            <span className="font-mono text-xs">
                              {selectedReport.interviews.id}
                            </span>
                          </p>
                        </footer> */}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Page;
