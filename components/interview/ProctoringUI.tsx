import React from "react";
import { AlertTriangle, Lock, Monitor, Eye, Copy, Skull } from "lucide-react";

interface ProctoringUIProps {
    isFullScreen: boolean;
    onEnterFullScreen: () => void;
    messages: string[];
    consentGiven: boolean;
    onConsent: () => void;
    cameraEnabled: boolean;
    micEnabled: boolean;
    showOverlay?: boolean;
}

export function ProctoringUI({
    isFullScreen,
    onEnterFullScreen,
    messages,
    consentGiven,
    onConsent,
    cameraEnabled,
    micEnabled,
    showOverlay = true,
}: ProctoringUIProps) {
    if (!consentGiven) {
        return (
            <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-2xl bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
                    <h1 className="text-3xl font-bold text-white mb-6">
                        Proctored Interview Consent
                    </h1>
                    <div className="text-gray-300 text-left space-y-4 mb-8">
                        <p className="flex items-start gap-3">
                            <Monitor className="text-blue-400 shrink-0 mt-1" />
                            This interview is AI-proctored. We monitor full-screen enforcement,
                            tab switching, and head movement.
                        </p>
                        <p className="flex items-start gap-3">
                            <Eye className="text-blue-400 shrink-0 mt-1" />
                            Camera and Microphone must be enabled at all times.
                        </p>
                        <p className="flex items-start gap-3">
                            <Lock className="text-green-400 shrink-0 mt-1" />
                            <strong>Privacy Notice:</strong> No video or audio is recorded or
                            stored. We only analyze behavioral metadata (e.g., looking away,
                            switching tabs) in real-time.
                        </p>
                        <p className="flex items-start gap-3">
                            <AlertTriangle className="text-amber-400 shrink-0 mt-1" />
                            Suspicious behavior (multiple faces, copy-paste) will be flagged
                            and may lead to disqualification.
                        </p>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={onConsent}
                            disabled={!cameraEnabled || !micEnabled}
                            className={`px-8 py-3 rounded-lg font-bold transition-all ${cameraEnabled && micEnabled
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-gray-600 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            {cameraEnabled && micEnabled
                                ? "I Understand & Agree"
                                : "Enable Camera & Mic to Proceed"}
                        </button>
                    </div>
                    {(!cameraEnabled || !micEnabled) && (
                        <p className="text-red-400 text-sm mt-4">
                            Please enable permissions in your browser settings.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Fullscreen Warning Overlay */}
            {!isFullScreen && showOverlay && (
                <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 text-center">
                    <AlertTriangle size={64} className="text-red-500 mb-4 animate-bounce" />
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Fullscreen Required
                    </h2>
                    <p className="text-gray-400 mb-6">
                        You must stay in full-screen mode during the entire interview.
                    </p>
                    <button
                        onClick={onEnterFullScreen}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                        Return to Fullscreen
                    </button>
                </div>
            )}

            {/* Toast-like Warnings */}
            <div className="fixed top-20 right-4 z-40 flex flex-col gap-2 pointer-events-none">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className="bg-red-500/90 text-white px-4 py-2 rounded shadow-lg flex items-center gap-2 animate-in slide-in-from-right fade-in"
                    >
                        <AlertTriangle size={16} />
                        <span className="text-sm font-medium">{msg}</span>
                    </div>
                ))}
            </div>
        </>
    );
}
