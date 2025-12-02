import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Upload, FileText, Sparkles, Loader2 } from "lucide-react";
import type { Job } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  jobId: z.string().min(1, "Please select a job"),
  resume: z.instanceof(File).optional(),
});

export default function CandidateUpload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: jobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const activeJobs = jobs?.filter(job => job.status === "active") || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      jobId: "",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", "/api/candidates/upload", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success!",
        description: "Resume uploaded and analyzed successfully",
      });
      setLocation("/candidates");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    if (data.phone) formData.append("phone", data.phone);
    formData.append("jobId", data.jobId);
    if (selectedFile) formData.append("resume", selectedFile);
    
    uploadMutation.mutate(formData);
  };

  const handleFileChange = (file: File | null) => {
    if (file) {
      const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or DOCX file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      form.setValue("resume", file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/candidates")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Candidates
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="page-title">
          <Sparkles className="h-8 w-8 text-primary" />
          Upload Candidate Resume
        </h1>
        <p className="text-muted-foreground mt-2">Upload a resume and our AI will automatically extract skills, experience, and match the candidate to your job requirements</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resume Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                data-testid="dropzone"
              >
                {selectedFile ? (
                  <div className="space-y-4">
                    <FileText className="h-16 w-16 text-primary mx-auto" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedFile(null)}
                      data-testid="button-remove-file"
                    >
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-16 w-16 text-muted-foreground mx-auto" />
                    <div>
                      <p className="text-lg font-medium mb-2">
                        Drop resume here or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports PDF and DOCX files
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                      className="hidden"
                      id="resume-upload"
                      data-testid="input-file"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("resume-upload")?.click()}
                      data-testid="button-browse"
                    >
                      Browse Files
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Candidate Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apply for Position</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-job">
                          <SelectValue placeholder="Select a job opening" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeJobs.length > 0 ? (
                          activeJobs.map((job) => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.title} - {job.department}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No active jobs available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setLocation("/candidates")}
              disabled={uploadMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={uploadMutation.isPending || !selectedFile}
              data-testid="button-submit"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Resume...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upload & Analyze
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
