import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Sparkles, X } from "lucide-react";
import { insertJobSchema } from "@shared/schema";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const formSchema = insertJobSchema.extend({
  requirements: z.array(z.string()).min(1, "Add at least one requirement"),
});

export default function JobForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [requirementInput, setRequirementInput] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      department: "",
      location: "",
      employmentType: "Full-time",
      description: "",
      requirements: [],
      responsibilities: "",
      salaryRange: "",
      status: "active",
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest("POST", "/api/jobs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success!",
        description: "Job posting created successfully",
      });
      setLocation("/jobs");
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
    createJobMutation.mutate(data);
  };

  const addRequirement = () => {
    if (requirementInput.trim()) {
      const currentRequirements = form.getValues("requirements");
      form.setValue("requirements", [...currentRequirements, requirementInput.trim()]);
      setRequirementInput("");
    }
  };

  const removeRequirement = (index: number) => {
    const currentRequirements = form.getValues("requirements");
    form.setValue("requirements", currentRequirements.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/jobs")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="page-title">
          <Sparkles className="h-8 w-8 text-primary" />
          Create Job Posting
        </h1>
        <p className="text-muted-foreground mt-2">Fill in the details below to create a new job posting with AI-powered candidate screening</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Senior Software Engineer" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Engineering" {...field} data-testid="input-department" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., San Francisco, CA or Remote" {...field} data-testid="input-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-employment-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salaryRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary Range (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., $100,000 - $150,000" {...field} data-testid="input-salary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the role, company culture, and what makes this opportunity unique..."
                          className="min-h-[120px] resize-none"
                          {...field}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="responsibilities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsibilities</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List the key responsibilities and day-to-day tasks..."
                          className="min-h-[120px] resize-none"
                          {...field}
                          data-testid="input-responsibilities"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Requirements (AI Matching)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Add skills and requirements. Our AI will use these to match and rank candidates automatically.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., React, TypeScript, 5+ years experience"
                  value={requirementInput}
                  onChange={(e) => setRequirementInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRequirement();
                    }
                  }}
                  data-testid="input-requirement"
                />
                <Button type="button" onClick={addRequirement} data-testid="button-add-requirement">
                  Add
                </Button>
              </div>

              {form.watch("requirements").length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.watch("requirements").map((req, index) => (
                    <Badge key={index} variant="secondary" className="gap-1 pr-1" data-testid={`requirement-${index}`}>
                      {req}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeRequirement(index)}
                        data-testid={`button-remove-requirement-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
              <FormMessage>{form.formState.errors.requirements?.message}</FormMessage>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setLocation("/jobs")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createJobMutation.isPending}
              data-testid="button-submit"
            >
              {createJobMutation.isPending ? "Creating..." : "Create Job Posting"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
