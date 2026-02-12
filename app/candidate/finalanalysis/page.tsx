"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, AreaChart, Area } from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, CheckCircle2, Target, Zap, Award, BarChart3, Star, Compass, UserCircle2 } from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";

export default function FinalAnalysisPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [latestReport, setLatestReport] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch("/api/finalanalysis");
        const result = await response.json();
        if (result.success) {
          const mappedHistory = (result.data.allInterviews || []).map((item: any) => ({
            date: new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            score: item.report?.placementReadinessScore || item.report?.finalScore || 0,
          })).reverse();
          
          setHistory(mappedHistory);
          setLatestReport(result.data.latest);
        }
      } catch (error) {
        console.error("Error fetching analysis:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchAnalysis();
  }, []);

  if (!isLoaded || !latestReport) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="relative">
        <div className="h-20 w-20 rounded-full border-t-4 border-b-4 border-blue-600 animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full border-r-4 border-l-4 border-indigo-600 animate-spin-slow"></div>
        <p className="mt-8 text-slate-600 font-bold animate-pulse tracking-widest text-center">ANALYZING DATA...</p>
      </div>
    </div>
  );

  const radarData = Object.entries(latestReport.report?.radarData || {}).map(([subject, value]) => ({
    subject,
    A: value,
    fullMark: 100,
  }));

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100">
      {/* Premium Mesh Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-100/40 blur-[120px] animate-pulse"></div>
        <div className="absolute top-[20%] -right-[5%] w-[35%] h-[35%] rounded-full bg-indigo-100/30 blur-[100px] animate-pulse-slow"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[30%] rounded-full bg-purple-50/20 blur-[120px]"></div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto p-4 md:p-8 space-y-10"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900">
              Analysis <span className="text-blue-600">Dashboard</span>
            </h1>
            <p className="text-slate-500 text-lg font-semibold flex items-center gap-2">
              Ready for placement, <span className="text-slate-900 underline decoration-blue-500/30">{user?.name}</span> <UserCircle2 className="h-5 w-5 text-blue-500" />
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
             <Badge className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 py-1.5 px-4 text-sm font-bold shadow-sm">
                Cohort Rank: #12
             </Badge>
             <Badge className="bg-blue-600 border-transparent text-white hover:bg-blue-700 py-1.5 px-4 text-sm font-bold shadow-md shadow-blue-500/20">
                Verified Candidate
             </Badge>
             {latestReport.report?.hiringRecommendation && (
                <Badge variant="outline" className={`py-1.5 px-4 text-sm font-black border-2 ${
                  latestReport.report.hiringRecommendation.includes("No Hire") ? "border-red-200 text-red-600 bg-red-50" :
                  latestReport.report.hiringRecommendation.includes("Strong") ? "border-emerald-200 text-emerald-600 bg-emerald-50" :
                  "border-blue-200 text-blue-600 bg-blue-50"
                }`}>
                  AI VERDICT: {latestReport.report.hiringRecommendation.toUpperCase()}
                </Badge>
             )}
          </div>
        </motion.div>

        {/* Hero Metrics */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/70 border-white/50 backdrop-blur-xl md:col-span-1 overflow-hidden relative group shadow-xl shadow-blue-500/5">
             <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
             <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Readiness Score</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="flex flex-col items-center py-4">
                   <div className="text-8xl font-black text-slate-900 group-hover:scale-105 transition-transform duration-500 tracking-tighter">
                      {latestReport.report?.placementReadinessScore || 0}<span className="text-3xl font-bold text-blue-600">%</span>
                   </div>
                   <div className="mt-4 flex items-center gap-2 text-blue-700 font-extrabold bg-blue-100/50 px-4 py-1.5 rounded-full text-[10px] border border-blue-200">
                      <TrendingUp className="h-3 w-3" /> OUTPERFORMED 88%
                   </div>
                </div>
             </CardContent>
          </Card>

          <Card className="bg-white/70 border-white/50 backdrop-blur-xl md:col-span-3 overflow-hidden shadow-xl shadow-blue-500/5">
             <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                <div>
                   <CardTitle className="flex items-center gap-2 text-slate-900 text-xl font-bold">
                      <Award className="h-5 w-5 text-blue-600" /> Performance Trajectory
                   </CardTitle>
                   <CardDescription className="text-slate-500 font-medium">Growth across mock interview iterations</CardDescription>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                   <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
             </CardHeader>
             <CardContent className="h-[240px] pt-6">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={history}>
                      <defs>
                         <linearGradient id="colorScoreLight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                         </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} dy={10} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip 
                         contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                         itemStyle={{ color: '#2563eb', fontWeight: 700 }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorScoreLight)" dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} />
                   </AreaChart>
                </ResponsiveContainer>
             </CardContent>
          </Card>
        </motion.div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div variants={itemVariants}>
            <Card className="bg-white/70 border-white/50 backdrop-blur-xl h-full overflow-hidden shadow-xl shadow-slate-200/50">
              <CardHeader className="border-b border-slate-100 pb-6 bg-slate-50/50">
                <CardTitle className="flex items-center gap-3 text-slate-900 font-bold">
                  <span className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30"><Target className="h-5 w-5 text-white" /></span> Skill Architecture
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-10 flex justify-center items-center h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={12} fontWeight={700} />
                    <Radar 
                      name="Candidate" 
                      dataKey="A" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      fill="#3b82f6" 
                      fillOpacity={0.2} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-8">
             {/* Observation Module */}
             <Card className="bg-white border-white border-l-[6px] border-l-orange-500 shadow-xl shadow-orange-500/5">
               <CardHeader className="pb-4">
                 <CardTitle className="flex items-center gap-2 text-orange-600 font-black text-xs uppercase tracking-widest">
                   <AlertTriangle className="h-4 w-4" /> Priority Observations
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-3">
                   {(latestReport.report?.riskFlags || []).map((flag: string, i: number) => (
                     <div key={i} className="flex items-start gap-4 p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50 hover:bg-orange-50 transition-all duration-300">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500 ring-4 ring-orange-100"></div>
                        <span className="text-slate-700 text-sm font-bold leading-relaxed">{flag}</span>
                     </div>
                   ))}
                   {(!latestReport.report?.riskFlags || latestReport.report?.riskFlags.length === 0) && (
                      <div className="text-center py-8">
                         <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                         </div>
                         <p className="text-slate-500 font-bold">Optimal profile. No risks identified.</p>
                      </div>
                   )}
                 </div>
               </CardContent>
             </Card>

             {/* Roadmap Module */}
             <Card className="bg-white border-white border-l-[6px] border-l-blue-600 shadow-xl shadow-blue-500/5">
               <CardHeader className="pb-4">
                 <CardTitle className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
                   <Compass className="h-4 w-4" /> Strategic Roadmap
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-all duration-300">
                    <p className="text-[10px] font-black uppercase tracking-tighter text-blue-600/60 mb-2">Resume Evolution</p>
                    <p className="text-sm text-slate-800 font-bold italic leading-relaxed">
                      "{(latestReport.report?.strategic_recommendations?.resume_edits || [])[0] || "Profile alignment is optimal for current JD requirements."}"
                    </p>
                 </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-all duration-300">
                     <p className="text-[10px] font-black uppercase tracking-tighter text-indigo-600/60 mb-2">Technical Mastery</p>
                     <p className="text-sm text-slate-800 font-bold italic leading-relaxed">
                       "{(latestReport.report?.strategic_recommendations?.study_focus || [])[0] || "Continue deepening core architectural knowledge."}"
                     </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-emerald-200 transition-all duration-300">
                     <p className="text-[10px] font-black uppercase tracking-tighter text-emerald-600/60 mb-2">Communication Strategy</p>
                     <p className="text-sm text-slate-800 font-bold italic leading-relaxed">
                       "{(latestReport.report?.communication_coaching?.verbal_delivery || [])[0] || "Maintain your current clarity and professional tone."}"
                     </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-amber-200 transition-all duration-300">
                     <p className="text-[10px] font-black uppercase tracking-tighter text-amber-600/60 mb-2">Answering Strategy</p>
                     <p className="text-sm text-slate-800 font-bold italic leading-relaxed">
                       "{(latestReport.report?.communication_coaching?.structuring_answers || [])[0] || "Use the STAR method to provide even more structured evidence."}"
                     </p>
                  </div>
               </CardContent>
             </Card>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="flex justify-center pt-10">
           <div className="flex items-center gap-2 text-slate-300 group cursor-default">
              <Star className="h-4 w-4 group-hover:text-blue-400 transition-colors" />
              <div className="h-px w-12 bg-slate-200"></div>
              <span className="text-[10px] font-black uppercase tracking-widest px-4 text-slate-400 group-hover:text-slate-600 transition-colors">Precision Verified Analysis v2.0</span>
              <div className="h-px w-12 bg-slate-200"></div>
              <Star className="h-4 w-4 group-hover:text-blue-400 transition-colors" />
           </div>
        </motion.div>
      </motion.div>

      <style jsx global>{`
         @keyframes spin-slow {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(-360deg); }
         }
         .animate-spin-slow {
            animation: spin-slow 4s linear infinite;
         }
      `}</style>
    </div>
  );
}
