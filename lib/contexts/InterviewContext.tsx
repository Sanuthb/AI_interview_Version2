"use client";
import React, {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
} from "react";

type QuestionItem = {
  question: string;
  [key: string]: unknown;
};

export type InterviewData = {
  Username: string;
  jobposition: string;
  questionlist: QuestionItem[];
};

export type InterviewContextValue = {
  interviewdata: InterviewData;
  setinterviewdata: Dispatch<SetStateAction<InterviewData>>;
  isInterviewing: boolean;
  setIsInterviewing: Dispatch<SetStateAction<boolean>>;
};

export const InterviewContext = createContext<InterviewContextValue | null>(
  null
);

export default function InterviewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [interviewdata, setinterviewdata] = useState<InterviewData>({
    Username: "",
    jobposition: "",
    questionlist: [],
  });
  const [isInterviewing, setIsInterviewing] = useState(false);
  const contextvalue = { interviewdata, setinterviewdata, isInterviewing, setIsInterviewing };
  return (
    <InterviewContext.Provider value={contextvalue}>
      {children}
    </InterviewContext.Provider>
  );
}
