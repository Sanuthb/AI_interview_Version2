"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Target,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "@/lib/contexts/auth-context";

// Define a basic type for the analysis data structure based on usage
interface AnalysisContent {
  resume_data_extraction: {
    candidate_name: string;
    target_role: string;
    education: string;
    years_experience: string;
  };
  overall_assessment: {
    match_score: number;
    hiring_status: string;
    verdict_summary: string;
  };
  feedback_analysis: {
    technical_rating: string;
    behavioral_rating: string;
    summary: string;
    key_observations: string[];
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
  communication_coaching: {
    verbal_delivery: string[];
    structuring_answers: string[];
  };
  skilltips: {
    coding_tips: string[];
    behavioral_tips: string[];
    system_design_tips: string[];
  };
  strategic_recommendations: {
    role_fit: string[];
    study_focus: string[];
    resume_edits: string[];
  };
  actionable_tips_and_tricks: {
    immediate_fixes: string[];
    interview_hacks: string[];
  };
}

interface AnalysisRecord {
  analysis: AnalysisContent;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  icon: any;
  id: string;
}

const FinalAnalysis = () => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { candidateId } = useAuth()
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!candidateId) return;
      try {
        const response = await axios.post("/api/finalanalysis", {
          candidateId: candidateId
        });
        const data = response.data
        if (data.success) {
          setAnalysis(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch analysis:", err);
      }
    };
    fetchAnalysis();
  }, [candidateId]);

  const Section = ({ title, children, icon: Icon, id }: SectionProps) => (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden mb-4">
      <button
        onClick={() => toggleSection(id)}
        className="w-full px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />}
          <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
        </div>
        {expandedSections[id] ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {expandedSections[id] && (
        <div className="px-4 pb-4 sm:px-6 sm:pb-6 border-t border-gray-700">
          {children}
        </div>
      )}
    </div>
  );

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return "bg-green-900/50 border-green-700";
    if (score >= 40) return "bg-yellow-900/50 border-yellow-700";
    return "bg-red-900/50 border-red-700";
  };

  if (!analysis) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 animate-pulse">Analyzing your interview performance...</p>
        </div>
      </div>
    );
  }

  // The record from Supabase contains the analysis in an 'analysis' column
  const data = analysis.analysis;

  return (
    <div className="min-h-screen bg-gradient-to-br  py-6 px-4 sm:py-8 sm:px-6 lg:px-8">
      <div className="mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {data.resume_data_extraction.candidate_name}
              </h1>
              <p className="text-gray-300 mt-1 text-sm sm:text-base">
                {data.resume_data_extraction.target_role}
              </p>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                {data.resume_data_extraction.education} •{" "}
                {data.resume_data_extraction.years_experience}
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end">
              <div
                className={`${getScoreBgColor(data.overall_assessment.match_score)} px-4 py-2 rounded-lg border`}
              >
                <p className="text-xs sm:text-sm text-gray-300 font-medium">
                  Match Score
                </p>
                <p
                  className={`text-3xl sm:text-4xl font-bold ${getScoreColor(data.overall_assessment.match_score)}`}
                >
                  {data.overall_assessment.match_score}%
                </p>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                <span className="text-red-600 font-semibold text-sm sm:text-base">
                  {data.overall_assessment.hiring_status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Assessment */}
        <Section title="Overall Verdict" icon={Target} id="verdict">
          <div className="mt-4 space-y-4">
            <div className="border-l-4 border-red-500 p-4 rounded bg-gray-900/50">
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                {data.overall_assessment.verdict_summary}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
              <div className="bg-gray-900/50 p-3 sm:p-4 rounded-lg border border-gray-700">
                <p className="text-xs sm:text-sm text-gray-300 font-medium">
                  Technical Rating
                </p>
                <p className="text-lg sm:text-xl font-bold text-red-600 mt-1">
                  {data.feedback_analysis.technical_rating}
                </p>
              </div>
              <div className="bg-gray-900/50 p-3 sm:p-4 rounded-lg border border-gray-700">
                <p className="text-xs sm:text-sm text-gray-300 font-medium">
                  Behavioral Rating
                </p>
                <p className="text-lg sm:text-xl font-bold text-red-600 mt-1">
                  {data.feedback_analysis.behavioral_rating}
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* Feedback Analysis */}
        <Section title="Interview Feedback" icon={AlertCircle} id="feedback">
          <div className="mt-4 space-y-4">
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">
                Summary
              </h3>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                {data.feedback_analysis.summary}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 text-sm sm:text-base">
                Key Observations
              </h3>
              <div className="space-y-2">
                {data.feedback_analysis.key_observations.map((obs, idx) => (
                  <div key={idx} className="flex gap-2 sm:gap-3">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-300 text-sm sm:text-base">{obs}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Skill Analysis */}
        <Section title="Skills Analysis" icon={TrendingUp} id="skills">
          <div className="mt-4 space-y-6">
            <div>
              <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2 text-sm sm:text-base">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Strengths
              </h3>
              <div className="space-y-2">
                {data.skill_analysis.strengths.map((strength, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border-l-4 border-green-500 bg-gray-900/50"
                  >
                    <p className="text-gray-300 text-sm sm:text-base">
                      {strength}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2 text-sm sm:text-base">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Weaknesses
              </h3>
              <div className="space-y-2">
                {data.skill_analysis.weaknesses.map((weakness, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border-l-4 border-red-500 bg-gray-900/50"
                  >
                    <p className="text-gray-300 text-sm sm:text-base">
                      {weakness}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-blue-700 mb-3 flex items-center gap-2 text-sm sm:text-base">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Soft Skills Assessment
              </h3>
              <div className="space-y-2">
                {data.skill_analysis.soft_skills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border-l-4 border-blue-500 bg-gray-900/50"
                  >
                    <p className="text-gray-300 text-sm sm:text-base">
                      {skill}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Resume vs Reality */}
        <Section title="Resume vs Reality Check" icon={AlertCircle} id="resume">
          <div className="mt-4 space-y-6">
            <div>
              <h3 className="font-semibold text-green-700 mb-3 text-sm sm:text-base">
                ✓ Verified Claims
              </h3>
              <div className="space-y-2">
                {data.resume_vs_reality.verified_claims.map((claim, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-900/50 p-3 rounded-lg border border-green-700"
                  >
                    <p className="text-gray-300 text-sm sm:text-base">
                      {claim}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-red-700 mb-3 text-sm sm:text-base">
                ⚠ Exaggerated Claims
              </h3>
              <div className="space-y-2">
                {data.resume_vs_reality.exaggerated_claims.map((claim, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-900/50 p-3 rounded-lg border border-red-700"
                  >
                    <p className="text-gray-300 text-sm sm:text-base">
                      {claim}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-orange-700 mb-3 text-sm sm:text-base">
                ✗ Missing Skills
              </h3>
              <div className="space-y-2">
                {data.resume_vs_reality.missing_skills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-900/50 p-3 rounded-lg border border-orange-700"
                  >
                    <p className="text-gray-300 text-sm sm:text-base">
                      {skill}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Communication Coaching */}
        <Section
          title="Communication Coaching"
          icon={Lightbulb}
          id="communication"
        >
          <div className="mt-4 space-y-6">
            <div>
              <h3 className="font-semibold text-purple-700 mb-3 text-sm sm:text-base">
                Verbal Delivery
              </h3>
              <div className="space-y-2">
                {data.communication_coaching.verbal_delivery.map((tip, idx) => (
                  <div
                    key={idx}
                    className=" p-3 rounded-lg border border-purple-200 flex gap-2 sm:gap-3"
                  >
                    <span className="text-purple-600 font-bold flex-shrink-0">
                      {idx + 1}.
                    </span>
                    <p className=" text-sm sm:text-base">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-purple-700 mb-3 text-sm sm:text-base">
                Structuring Answers
              </h3>
              <div className="space-y-2">
                {data.communication_coaching.structuring_answers.map(
                  (tip, idx) => (
                    <div
                      key={idx}
                      className=" p-3 rounded-lg border border-purple-200 flex gap-2 sm:gap-3"
                    >
                      <span className="text-purple-600 font-bold flex-shrink-0">
                        {idx + 1}.
                      </span>
                      <p className=" text-sm sm:text-base">{tip}</p>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* Skill Tips */}
        <Section title="Skill Development Tips" icon={BookOpen} id="tips">
          <div className="mt-4 space-y-6">
            <div>
              <h3 className="font-semibold text-indigo-700 mb-3 text-sm sm:text-base">
                Coding Tips
              </h3>
              <div className="space-y-2">
                {data.skilltips.coding_tips.map((tip, idx) => (
                  <div
                    key={idx}
                    className=" p-3 rounded-lg border border-indigo-200 flex gap-2 sm:gap-3"
                  >
                    <span className="text-indigo-600 font-bold flex-shrink-0">
                      •
                    </span>
                    <p className=" text-sm sm:text-base">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-indigo-700 mb-3 text-sm sm:text-base">
                Behavioral Tips
              </h3>
              <div className="space-y-2">
                {data.skilltips.behavioral_tips.map((tip, idx) => (
                  <div
                    key={idx}
                    className=" p-3 rounded-lg border border-indigo-200 flex gap-2 sm:gap-3"
                  >
                    <span className="text-indigo-600 font-bold flex-shrink-0">
                      •
                    </span>
                    <p className=" text-sm sm:text-base">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-indigo-700 mb-3 text-sm sm:text-base">
                System Design Tips
              </h3>
              <div className="space-y-2">
                {data.skilltips.system_design_tips.map((tip, idx) => (
                  <div
                    key={idx}
                    className=" p-3 rounded-lg border border-indigo-200 flex gap-2 sm:gap-3"
                  >
                    <span className="text-indigo-600 font-bold flex-shrink-0">
                      •
                    </span>
                    <p className=" text-sm sm:text-base">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Strategic Recommendations */}
        <Section
          title="Strategic Recommendations"
          icon={Target}
          id="recommendations"
        >
          <div className="mt-4 space-y-6">
            <div>
              <h3 className="font-semibold text-teal-700 mb-3 text-sm sm:text-base">
                Better Role Fit
              </h3>
              <div className="space-y-2">
                {data.strategic_recommendations.role_fit.map((role, idx) => (
                  <div
                    key={idx}
                    className=" p-3 rounded-lg border border-teal-200"
                  >
                    <p className=" text-sm sm:text-base">{role}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-teal-700 mb-3 text-sm sm:text-base">
                Study Focus Areas
              </h3>
              <div className="space-y-2">
                {data.strategic_recommendations.study_focus.map(
                  (focus, idx) => (
                    <div
                      key={idx}
                      className=" p-3 rounded-lg flex gap-2 sm:gap-3 border border-teal-200"
                    >
                      <span className="text-teal-600 font-bold flex-shrink-0">
                        {idx + 1}.
                      </span>
                      <p className=" text-sm sm:text-base">{focus}</p>
                    </div>
                  ),
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-teal-700 mb-3 text-sm sm:text-base">
                Resume Edits
              </h3>
              <div className="space-y-2">
                {data.strategic_recommendations.resume_edits.map(
                  (edit, idx) => (
                    <div
                      key={idx}
                      className=" p-3 rounded-lg border border-teal-200"
                    >
                      <p className=" text-sm sm:text-base">{edit}</p>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* Actionable Tips */}
        <Section
          title="Actionable Tips & Tricks"
          icon={Lightbulb}
          id="actionable"
        >
          <div className="mt-4 space-y-6">
            <div>
              <h3 className="font-semibold text-pink-700 mb-3 text-sm sm:text-base">
                Immediate Fixes
              </h3>
              <div className="space-y-2">
                {data.actionable_tips_and_tricks.immediate_fixes.map(
                  (fix, idx) => (
                    <div
                      key={idx}
                      className=" p-3 rounded-lg border border-pink-200 flex gap-2 sm:gap-3"
                    >
                      <span className="text-pink-600 font-bold flex-shrink-0">
                        →
                      </span>
                      <p className=" text-sm sm:text-base">{fix}</p>
                    </div>
                  ),
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-pink-700 mb-3 text-sm sm:text-base">
                Interview Hacks
              </h3>
              <div className="space-y-2">
                {data.actionable_tips_and_tricks.interview_hacks.map(
                  (hack, idx) => (
                    <div
                      key={idx}
                      className=" p-3 rounded-lg border border-pink-200 flex gap-2 sm:gap-3"
                    >
                      <span className="text-pink-600 font-bold flex-shrink-0">
                        💡
                      </span>
                      <p className=" text-sm sm:text-base">{hack}</p>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default FinalAnalysis;
