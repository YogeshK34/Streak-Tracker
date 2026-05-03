"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Trash2, Plus, Edit2, Search, Filter, ChevronDown, ChevronUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getLeetCodeProblems,
  addLeetCodeProblem,
  deleteLeetCodeProblem,
  updateLeetCodeProblem,
  exportLeetCodeData,
  LeetCodeProblem,
} from "@/app/services/leetcode";
import { useAuth } from "@/lib/auth-context";

interface LeetCodeTrackerProps {
  onProblemCountChange?: (count: number, problemsByDate?: Record<string, number>) => void;
}

const DATA_STRUCTURE_OPTIONS = [
  "Arrays",
  "LinkedList",
  "Strings",
  "Trees",
  "Graphs",
  "Stack",
  "Queue",
  "HashMap",
];

const TECHNIQUE_OPTIONS = [
  "Two Pointer",
  "Sliding Window",
  "Binary Search",
  "Floyd's Algorithm",
  "Fast & Slow Pointers",
  "Recursion",
  "Dynamic Programming",
];

export function LeetCodeTracker({ onProblemCountChange }: LeetCodeTrackerProps = {}) {
  const [problems, setProblems] = useState<LeetCodeProblem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingProblem, setIsAddingProblem] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<LeetCodeProblem | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [startDateCalendarOpen, setStartDateCalendarOpen] = useState(false);
  const [endDateCalendarOpen, setEndDateCalendarOpen] = useState(false);
  const [cancelConfirmDialogOpen, setCancelConfirmDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const itemsPerPage = 5;
  const [formData, setFormData] = useState({
    problem_date: format(new Date(), "yyyy-MM-dd"),
    problem_name: "",
    description: "",
  });
  const [dataStructure, setDataStructure] = useState("");
  const [dataStructureOther, setDataStructureOther] = useState("");
  const [technique, setTechnique] = useState("");
  const [techniqueOther, setTechniqueOther] = useState("");
  const [filterDataStructure, setFilterDataStructure] = useState("");
  const [filterTechnique, setFilterTechnique] = useState("");
  const { user } = useAuth();

  const hasFormChanges = formData.problem_name.trim() !== "" || formData.description.trim() !== "" || dataStructure !== "" || technique !== "";

  useEffect(() => {
    if (!user) {
      setIsLoaded(false);
      return;
    }

    loadProblems();
  }, [user]);

  // Memoize the problems by date calculation
  const problemsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    problems.forEach((problem) => {
      const date = problem.problem_date;
      map[date] = (map[date] || 0) + 1;
    });
    return map;
  }, [problems]);

  // Notify parent when problems count changes (only after loaded)
  useEffect(() => {
    if (isLoaded) {
      onProblemCountChange?.(problems.length, problemsByDate);
    }
  }, [problems.length, isLoaded]);

  const loadProblems = async () => {
    try {
      setError(null);
      const res = await getLeetCodeProblems();
      setProblems(res.data);
      setCurrentPage(1); // Reset to first page when loading
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Failed to load LeetCode problems:", err);
      setError("Unable to load problems. Try refreshing.");
    } finally {
      setIsLoaded(true);
    }
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.problem_date || !formData.problem_name.trim()) {
      setError("Please fill in date and problem name");
      return;
    }

    try {
      setError(null);

      const finalDataStructure =
        dataStructure === "other" ? `Other: ${dataStructureOther}` : dataStructure || null;
      const finalTechnique = technique === "other" ? `Other: ${techniqueOther}` : technique || null;

      if (editingId) {
        await updateLeetCodeProblem(
          editingId,
          formData.problem_date,
          formData.problem_name,
          formData.description,
          finalDataStructure || undefined,
          finalTechnique || undefined
        );
        setProblems((prev) =>
          prev.map((p) =>
            p.id === editingId
              ? {
                  ...p,
                  problem_date: formData.problem_date,
                  problem_name: formData.problem_name,
                  description: formData.description,
                  data_structure: finalDataStructure,
                  technique: finalTechnique,
                }
              : p
          )
        );
      } else {
        const result = await addLeetCodeProblem(
          formData.problem_date,
          formData.problem_name,
          formData.description,
          finalDataStructure || undefined,
          finalTechnique || undefined
        );
        // Add the new problem to state directly instead of refetching all
        if (result.data) {
          setProblems((prev) => [result.data, ...prev]);
        }
      }

      // Reset form
      setFormData({
        problem_date: format(new Date(), "yyyy-MM-dd"),
        problem_name: "",
        description: "",
      });
      setDataStructure("");
      setDataStructureOther("");
      setTechnique("");
      setTechniqueOther("");
      setIsAddingProblem(false);
      setEditingId(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to save problem: ${errorMsg}`);
    }
  };

  const handleEdit = (problem: LeetCodeProblem) => {
    setEditingId(problem.id);
    const problemDate = new Date(problem.problem_date);
    setSelectedDate(problemDate);
    setFormData({
      problem_date: problem.problem_date,
      problem_name: problem.problem_name,
      description: problem.description || "",
    });

    // Extract data structure
    if (problem.data_structure) {
      if (problem.data_structure.startsWith("Other: ")) {
        setDataStructure("other");
        setDataStructureOther(problem.data_structure.substring(7));
      } else {
        setDataStructure(problem.data_structure);
        setDataStructureOther("");
      }
    } else {
      setDataStructure("");
      setDataStructureOther("");
    }

    // Extract technique
    if (problem.technique) {
      if (problem.technique.startsWith("Other: ")) {
        setTechnique("other");
        setTechniqueOther(problem.technique.substring(7));
      } else {
        setTechnique(problem.technique);
        setTechniqueOther("");
      }
    } else {
      setTechnique("");
      setTechniqueOther("");
    }

    setIsAddingProblem(true);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    try {
      setError(null);
      await deleteLeetCodeProblem(deletingId);
      setProblems((prev) => prev.filter((p) => p.id !== deletingId));
      setDeletingId(null);
      if (selectedProblem?.id === deletingId) {
        handleCloseDetails();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to delete problem: ${errorMsg}`);
    }
  };

  const handleCancel = () => {
    if (hasFormChanges) {
      setCancelConfirmDialogOpen(true);
    } else {
      handleConfirmCancel();
    }
  };

  const handleConfirmCancel = () => {
    setIsAddingProblem(false);
    setEditingId(null);
    setSelectedDate(new Date());
    setCalendarOpen(false);
    setFormData({
      problem_date: format(new Date(), "yyyy-MM-dd"),
      problem_name: "",
      description: "",
    });
    setDataStructure("");
    setDataStructureOther("");
    setTechnique("");
    setTechniqueOther("");
    setError(null);
    setCancelConfirmDialogOpen(false);
  };

  const handleExport = async (fmt: "csv" | "json" | "excel") => {
    setExporting(true);
    try {
      const res = await exportLeetCodeData(fmt);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leetcode-export-${new Date().toISOString().split("T")[0]}.${fmt === "excel" ? "xlsx" : fmt}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Failed to export data");
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleOpenDetails = (problem: LeetCodeProblem) => {
    setSelectedProblem(problem);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedProblem(null);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFormData((prev) => ({
        ...prev,
        problem_date: format(date, "yyyy-MM-dd"),
      }));
      setCalendarOpen(false);
    }
  };

  // Filter helper functions
  const getFilteredProblems = () => {
    let filtered = problems;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) =>
        p.problem_name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
      );
    }

    // Apply data structure filter
    if (filterDataStructure) {
      filtered = filtered.filter((p) => p.data_structure === filterDataStructure);
    }

    // Apply technique filter
    if (filterTechnique) {
      filtered = filtered.filter((p) => p.technique === filterTechnique);
    }

    // Apply date range filter
    if (filterStartDate || filterEndDate) {
      filtered = filtered.filter((p) => {
        const problemDate = new Date(p.problem_date);
        if (filterStartDate && problemDate < filterStartDate) return false;
        if (filterEndDate) {
          const endDate = new Date(filterEndDate);
          endDate.setHours(23, 59, 59, 999);
          if (problemDate > endDate) return false;
        }
        return true;
      });
    }

    return filtered;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStartDate(null);
    setFilterEndDate(null);
    setFilterDataStructure("");
    setFilterTechnique("");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery.trim() !== "" || filterStartDate !== null || filterEndDate !== null || filterDataStructure !== "" || filterTechnique !== "";

  // Pagination logic
  const filteredProblems = getFilteredProblems();
  const totalPages = Math.ceil(filteredProblems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProblems = filteredProblems.slice(startIndex, endIndex);

  if (!isLoaded) {
    return <div className="text-center p-8 text-slate-600 dark:text-slate-400">Loading LeetCode problems...</div>;
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <Card className="rounded-xl sm:rounded-[2rem] border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-900/95 shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/30">
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400">Problems Solved</p>
              <CardTitle className="text-lg sm:text-2xl font-semibold text-black dark:text-white">{problems.length} problems</CardTitle>
            </div>
            {!isAddingProblem && (
              <Button
                onClick={() => {
                  setIsAddingProblem(true);
                  setError(null);
                }}
                className="gap-2 bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20 text-sm py-2 h-auto"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Problem</span>
                <span className="sm:hidden">Add</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search and Filter Section */}
          {!isAddingProblem && problems.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              {/* Search Bar + Filters Row */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search problems..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9 text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                    aria-label="Search problems by name or description"
                  />
                </div>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className="gap-2 text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>

              {/* Export Buttons Row - Right Aligned */}
              <div className="flex justify-end gap-1 sm:gap-2">
                <Button
                  onClick={() => handleExport("csv")}
                  disabled={exporting}
                  size="sm"
                  variant="outline"
                  className="gap-2 text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">CSV</span>
                </Button>
                <Button
                  onClick={() => handleExport("json")}
                  disabled={exporting}
                  size="sm"
                  variant="outline"
                  className="gap-2 text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">JSON</span>
                </Button>
                <Button
                  onClick={() => handleExport("excel")}
                  disabled={exporting}
                  size="sm"
                  variant="outline"
                  className="gap-2 text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Excel</span>
                </Button>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 items-center">
                  {searchQuery.trim() && (
                    <Badge variant="secondary" className="gap-1">
                      Search: {searchQuery}
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setCurrentPage(1);
                        }}
                        className="ml-1 hover:text-slate-600"
                        aria-label="Clear search"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filterDataStructure && (
                    <Badge variant="secondary" className="gap-1">
                      DS: {filterDataStructure}
                      <button
                        onClick={() => {
                          setFilterDataStructure("");
                          setCurrentPage(1);
                        }}
                        className="ml-1 hover:text-slate-600"
                        aria-label="Clear data structure filter"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filterTechnique && (
                    <Badge variant="secondary" className="gap-1">
                      Tech: {filterTechnique}
                      <button
                        onClick={() => {
                          setFilterTechnique("");
                          setCurrentPage(1);
                        }}
                        className="ml-1 hover:text-slate-600"
                        aria-label="Clear technique filter"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filterStartDate && (
                    <Badge variant="secondary" className="gap-1">
                      From: {format(filterStartDate, "MMM d")}
                      <button
                        onClick={() => {
                          setFilterStartDate(null);
                          setCurrentPage(1);
                        }}
                        className="ml-1 hover:text-slate-600"
                        aria-label="Clear start date filter"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filterEndDate && (
                    <Badge variant="secondary" className="gap-1">
                      To: {format(filterEndDate, "MMM d")}
                      <button
                        onClick={() => {
                          setFilterEndDate(null);
                          setCurrentPage(1);
                        }}
                        className="ml-1 hover:text-slate-600"
                        aria-label="Clear end date filter"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {hasActiveFilters && (
                    <Button
                      onClick={clearFilters}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-auto py-1"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              )}

              {/* Filter Panel - Show/hide with display + height animation */}
              <div className={`${!showFilters ? "hidden" : "block"} relative p-3 sm:p-4 rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-slate-800/50 space-y-3 sm:space-y-4 transition-all duration-200`}>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="filter-data-structure" className="text-xs sm:text-sm">
                      Data Structure
                    </Label>
                    <Select value={filterDataStructure} onValueChange={(value) => {
                      setFilterDataStructure(value);
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger id="filter-data-structure" className="text-xs sm:text-sm h-auto py-1.5 sm:py-2 bg-white dark:bg-slate-950/50">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATA_STRUCTURE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="filter-technique" className="text-xs sm:text-sm">
                      Technique
                    </Label>
                    <Select value={filterTechnique} onValueChange={(value) => {
                      setFilterTechnique(value);
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger id="filter-technique" className="text-xs sm:text-sm h-auto py-1.5 sm:py-2 bg-white dark:bg-slate-950/50">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        {TECHNIQUE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="start-date" className="text-xs sm:text-sm">
                      Start Date
                    </Label>
                    <Popover open={startDateCalendarOpen} onOpenChange={setStartDateCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id="start-date"
                          variant="outline"
                          className="w-full justify-start text-left font-normal text-xs sm:text-sm py-2 h-auto bg-white dark:bg-slate-950/50"
                        >
                          {filterStartDate ? format(filterStartDate, "MMM d, yyyy") : "Select start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filterStartDate || undefined}
                          onSelect={(date) => {
                            setFilterStartDate(date || null);
                            setStartDateCalendarOpen(false);
                            setCurrentPage(1);
                          }}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="end-date" className="text-xs sm:text-sm">
                      End Date
                    </Label>
                    <Popover open={endDateCalendarOpen} onOpenChange={setEndDateCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id="end-date"
                          variant="outline"
                          className="w-full justify-start text-left font-normal text-xs sm:text-sm py-2 h-auto bg-white dark:bg-slate-950/50"
                        >
                          {filterEndDate ? format(filterEndDate, "MMM d, yyyy") : "Select end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filterEndDate || undefined}
                          onSelect={(date) => {
                            setFilterEndDate(date || null);
                            setEndDateCalendarOpen(false);
                            setCurrentPage(1);
                          }}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => setShowFilters(false)}
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Result Count - Fixed height to prevent reflow */}
          <div className="h-6 sm:h-5">
            {problems.length > 0 && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Showing {paginatedProblems.length} of {filteredProblems.length} problems
                {hasActiveFilters && ` (filtered from ${problems.length} total)`}
              </p>
            )}
          </div>

          {/* Add/Edit Form */}
          {isAddingProblem && (
            <form onSubmit={handleAddOrUpdate} className="space-y-3 sm:space-y-4 p-3 sm:p-4 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/50">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="problem-date" className="text-xs sm:text-sm">
                    Problem Date
                  </Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="problem-date"
                        variant="outline"
                        className="w-full justify-start text-left font-normal text-xs sm:text-sm py-2 h-auto"
                      >
                        {format(selectedDate, "MMM d, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="problem-name" className="text-xs sm:text-sm">
                    Problem Name *
                  </Label>
                  <Input
                    id="problem-name"
                    placeholder="e.g., Two Sum, LRU Cache"
                    value={formData.problem_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        problem_name: e.target.value,
                      }))
                    }
                    className="text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="description" className="text-xs sm:text-sm">
                  Description / Approach
                </Label>
                <Textarea
                  id="description"
                  placeholder="Add your solution approach, key insights, or learning notes"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="min-h-16 text-xs sm:text-sm py-1.5 sm:py-2"
                />
              </div>

              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="data-structure" className="text-xs sm:text-sm">
                    Data Structure
                  </Label>
                  <Select value={dataStructure} onValueChange={setDataStructure}>
                    <SelectTrigger id="data-structure" className="text-xs sm:text-sm h-auto py-1.5 sm:py-2">
                      <SelectValue placeholder="Select a data structure" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATA_STRUCTURE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {dataStructure === "other" && (
                    <Input
                      placeholder="Specify data structure"
                      value={dataStructureOther}
                      onChange={(e) => setDataStructureOther(e.target.value)}
                      className="text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                    />
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="technique" className="text-xs sm:text-sm">
                    Technique
                  </Label>
                  <Select value={technique} onValueChange={setTechnique}>
                    <SelectTrigger id="technique" className="text-xs sm:text-sm h-auto py-1.5 sm:py-2">
                      <SelectValue placeholder="Select a technique" />
                    </SelectTrigger>
                    <SelectContent>
                      {TECHNIQUE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {technique === "other" && (
                    <Input
                      placeholder="Specify technique"
                      value={techniqueOther}
                      onChange={(e) => setTechniqueOther(e.target.value)}
                      className="text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                    />
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="gap-2 bg-cyan-500 hover:bg-cyan-600 text-white text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                >
                  {editingId ? "Update" : "Add"} Problem
                </Button>
              </div>
            </form>
          )}

          {/* Problems Table/Cards */}
          {problems.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-slate-500 dark:text-slate-400">
              <p className="text-xs sm:text-sm">No problems added yet. Start tracking your LeetCode progress!</p>
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-slate-500 dark:text-slate-400">
              <p className="text-xs sm:text-sm">No problems match your search or filters. Try adjusting them.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-300 dark:border-slate-700">
                      <th className="text-left px-3 py-2 sm:px-4 sm:py-3 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                      <th className="text-left px-3 py-2 sm:px-4 sm:py-3 font-semibold text-slate-700 dark:text-slate-300">Problem Name</th>
                      <th className="text-left px-3 py-2 sm:px-4 sm:py-3 font-semibold text-slate-700 dark:text-slate-300">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProblems.map((problem) => (
                      <tr
                        key={problem.id}
                        className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-slate-900 dark:text-slate-100">
                          {format(new Date(problem.problem_date), "MMM d, yyyy")}
                        </td>
                        <td
                          onClick={() => handleOpenDetails(problem)}
                          className="px-3 py-2 sm:px-4 sm:py-3 font-medium text-slate-900 dark:text-slate-100 cursor-pointer hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
                        >
                          <div className="flex flex-col gap-1">
                            <span>{problem.problem_name}</span>
                            <div className="flex flex-wrap gap-1">
                              {problem.data_structure && (
                                <Badge variant="outline" className="text-xs">
                                  {problem.data_structure}
                                </Badge>
                              )}
                              {problem.technique && (
                                <Badge variant="outline" className="text-xs">
                                  {problem.technique}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {problem.description || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-2 sm:space-y-3">
                {paginatedProblems.map((problem) => (
                  <div
                    key={problem.id}
                    className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 sm:p-4 bg-white dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetails(problem)}
                  >
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                        {format(new Date(problem.problem_date), "MMM d, yyyy")}
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 break-words hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">
                        {problem.problem_name}
                      </p>
                    </div>
                    {problem.description && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-2">
                        {problem.description}
                      </p>
                    )}
                    {(problem.data_structure || problem.technique) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {problem.data_structure && (
                          <Badge variant="outline" className="text-xs">
                            {problem.data_structure}
                          </Badge>
                        )}
                        {problem.technique && (
                          <Badge variant="outline" className="text-xs">
                            {problem.technique}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4 sm:mt-6 overflow-x-auto">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => {
                            setCurrentPage(Math.max(1, currentPage - 1));
                            setStartDateCalendarOpen(false);
                            setEndDateCalendarOpen(false);
                            setCalendarOpen(false);
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => {
                              setCurrentPage(page);
                              setStartDateCalendarOpen(false);
                              setEndDateCalendarOpen(false);
                              setCalendarOpen(false);
                            }}
                            isActive={currentPage === page}
                            className="cursor-pointer text-xs sm:text-sm"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => {
                            setCurrentPage(Math.min(totalPages, currentPage + 1));
                            setStartDateCalendarOpen(false);
                            setEndDateCalendarOpen(false);
                            setCalendarOpen(false);
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsDialogOpen} onOpenChange={handleCloseDetails}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <DialogTitle className="text-base sm:text-lg md:text-xl font-semibold flex-1 pr-2 break-words">
              Problem Details
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">
            View and edit your LeetCode problem details
          </DialogDescription>

          {selectedProblem && (
            <div className="space-y-3 sm:space-y-4 md:space-y-5 pr-0">
              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400 mb-1">
                  Problem Name
                </p>
                <p className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 break-words">
                  {selectedProblem.problem_name}
                </p>
              </div>

              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400 mb-1">
                  Date
                </p>
                <p className="text-xs sm:text-sm md:text-base text-slate-900 dark:text-slate-100">
                  {format(new Date(selectedProblem.problem_date), "MMMM d, yyyy")}
                </p>
              </div>

              {selectedProblem.description && (
                <div>
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400 mb-2">
                    Description / Approach
                  </p>
                  <p className="text-xs sm:text-sm md:text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words max-h-[40vh] overflow-y-auto">
                    {selectedProblem.description}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2 justify-end">
                <Button
                  onClick={() => {
                    handleOpenDetails(selectedProblem);
                    setDetailsDialogOpen(false);
                    handleEdit(selectedProblem);
                  }}
                  className="gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  onClick={() => {
                    if (selectedProblem) {
                      handleDelete(selectedProblem.id);
                    }
                  }}
                  className="gap-2 bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Problem"
        description="Are you sure you want to delete this problem? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDialog
        open={cancelConfirmDialogOpen}
        onOpenChange={setCancelConfirmDialogOpen}
        title="Discard Changes?"
        description="You have unsaved changes. Do you want to discard them or keep editing?"
        confirmText="Discard"
        cancelText="Keep Editing"
        isDestructive
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}
