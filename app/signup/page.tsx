"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign Up Disabled</CardTitle>
          <CardDescription className="text-center">
            Candidate accounts are created and managed by the placement admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Self-registration is disabled for this system. Your placement cell or administrator will
              create your account and share your login credentials.
            </AlertDescription>
          </Alert>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            If you believe you should have access but don't have an account, please contact your
            placement coordinator.
          </div>

          <div className="mt-6 text-center">
            <Button asChild variant="default">
              <Link href="/login">
                Go to Login
              </Link>
            </Button>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:underline">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

