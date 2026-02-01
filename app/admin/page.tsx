"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, PlusCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";

export default function AdminPage() {
  const { user } = useAuth();
  console.log("user", user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage interviews and view candidate results
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card/20 backdrop-blur-xl border-white/10 hover:bg-card/30 transition-all shadow-lg hover:shadow-primary/10">
          <CardHeader>
            <CardTitle>Create Interview</CardTitle>
            <CardDescription>Set up a new placement interview</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/create-interview">
              <Button className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Interview
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card/20 backdrop-blur-xl border-white/10 hover:bg-card/30 transition-all shadow-lg hover:shadow-blue-500/10">
          <CardHeader>
            <CardTitle>View Interviews</CardTitle>
            <CardDescription>Browse all created interviews</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/interviews">
              <Button className="w-full" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                View All Interviews
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
