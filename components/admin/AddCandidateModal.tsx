"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { UserPlus, Search, Loader2, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

interface AddCandidateModalProps {
  interviewId: string;
}

export function AddCandidateModal({ interviewId }: AddCandidateModalProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  
  // Bulk Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedCount, setParsedCount] = useState<number>(0);
  const [uploadStats, setUploadStats] = useState<{ created: number; skipped: number } | null>(null);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/interviews/${interviewId}/candidates?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async (usn: string) => {
    setIsAdding(usn);
    try {
      const res = await fetch(`/api/admin/interviews/${interviewId}/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usn }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add candidate");
      }

      toast.success("Candidate added successfully");
      setResults(prev => prev.filter(r => r.usn !== usn));
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add candidate");
    } finally {
      setIsAdding(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setUploadStats(null);
      
      // Quick parse to count rows
      try {
        const data = await parseExcelFile(selectedFile);
        setParsedCount(data.length);
      } catch (error) {
        console.error("Error previewing file:", error);
        setParsedCount(0);
      }
    }
  };

  const parseExcelFile = async (file: File): Promise<any[]> => {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      
      // Normalize keys to lowercase to be safe
      return jsonData.map((row: any) => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
          newRow[key.toLowerCase().trim()] = row[key];
        });
        return newRow;
      });
  };

  const handleBulkUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const candidates = await parseExcelFile(file);
      
      if (candidates.length === 0) {
        throw new Error("No candidates found in file");
      }

      const formattedCandidates = candidates.map(c => ({
        name: c.name || c.student_name || "Unknown",
        usn: c.usn || c.student_id,
        email: c.email || c.mail_id,
        batch: c.batch ? String(c.batch) : undefined,
        dept: c.dept || c.department,
        interview_id: interviewId
      })).filter(c => c.usn);

      if (formattedCandidates.length === 0) {
        throw new Error("No valid candidates with USN found");
      }

      const res = await fetch(`/api/admin/interviews/${interviewId}/candidates/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: formattedCandidates }),
      });

      if (!res.ok) {
         const errData = await res.json();
         throw new Error(errData.error || "Bulk upload failed");
      }

      const result = await res.json();
      setUploadStats({
        created: result.data.createdOrUpdated.length,
        skipped: result.data.skipped.length
      });
      
      toast.success(`Processed ${formattedCandidates.length} candidates`);
      router.refresh();
      setFile(null);
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error(error.message || "Failed to upload candidates");
    } finally {
      setIsUploading(false);
    }
  };

  if (!mounted) {
    return (
      <Button disabled>
        <UserPlus className="mr-2 h-4 w-4" />
        Add Candidate
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Candidate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Candidates</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Search</TabsTrigger>
            <TabsTrigger value="bulk">Excel Upload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-4 py-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or USN..."
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </form>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {results.length > 0 ? (
                results.map((user) => (
                  <div
                    key={user.usn}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.usn} • {user.dept} • Batch {user.batch}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdd(user.usn)}
                      disabled={isAdding === user.usn}
                    >
                      {isAdding === user.usn ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Add"
                      )}
                    </Button>
                  </div>
                ))
              ) : query && !isSearching ? (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  No matching registered users found.
                </p>
              ) : (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  Enter a name or USN to search for registered users.
                </p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="bulk" className="space-y-4 py-4">
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-4 bg-muted/20">
              <div className="bg-primary/10 p-3 rounded-full">
                 <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">Excel (.xlsx) or CSV files</p>
              </div>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="max-w-xs"
              />
            </div>

            {file && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{parsedCount > 0 ? `${parsedCount} candidates found` : 'Scanning...'}</p>
                  </div>
                </div>
                <Button onClick={handleBulkUpload} disabled={isUploading || parsedCount === 0}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Candidates"
                  )}
                </Button>
              </div>
            )}

            {uploadStats && (
               <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-green-700 font-medium">
                    <CheckCircle2 className="h-5 w-5" />
                    Upload Complete
                  </div>
                  <div className="text-sm text-green-600">
                    <p>Successfully added/updated: {uploadStats.created}</p>
                    {uploadStats.skipped > 0 && <p>Skipped (Not registered): {uploadStats.skipped}</p>}
                  </div>
               </div>
            )}
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>Ensure your file has <strong>Name</strong>, <strong>USN</strong>, and optional Email/Batch/Dept columns.<br/>Only students who have already registered on the platform will be added.</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
