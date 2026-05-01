"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { getDSNotes, addDSNote, updateDSNote, deleteDSNote, type DSNote } from "@/app/services/dsnotes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Trash2, Plus, Edit2, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";

export function DSNotesTracker() {
  const [notes, setNotes] = useState<DSNote[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNote, setSelectedNote] = useState<DSNote | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [startDateCalendarOpen, setStartDateCalendarOpen] = useState(false);
  const [endDateCalendarOpen, setEndDateCalendarOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const itemsPerPage = 5;

  // Form state
  const [formData, setFormData] = useState({
    ds_name: "",
    concept_name: "",
    notes: "",
  });

  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setIsLoaded(false);
      return;
    }

    loadNotes();
  }, [user]);

  const loadNotes = async () => {
    try {
      setError(null);
      const res = await getDSNotes();
      setNotes(res.data);
      setCurrentPage(1);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Failed to load DS notes:", err);
      setError("Unable to load notes. Try refreshing.");
    } finally {
      setIsLoaded(true);
    }
  };

  // Filter helper functions
  const getFilteredNotes = () => {
    let filtered = notes;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((n) =>
        n.ds_name.toLowerCase().includes(query) ||
        n.concept_name.toLowerCase().includes(query) ||
        n.notes.toLowerCase().includes(query)
      );
    }

    // Apply date range filter
    if (filterStartDate || filterEndDate) {
      filtered = filtered.filter((n) => {
        const noteDate = new Date(n.created_at);
        if (filterStartDate && noteDate < filterStartDate) return false;
        if (filterEndDate) {
          const endDate = new Date(filterEndDate);
          endDate.setHours(23, 59, 59, 999);
          if (noteDate > endDate) return false;
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
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery.trim() !== "" || filterStartDate !== null || filterEndDate !== null;

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ds_name.trim() || !formData.concept_name.trim() || !formData.notes.trim()) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setError(null);

      if (editingId) {
        await updateDSNote(
          editingId,
          formData.ds_name.trim(),
          formData.concept_name.trim(),
          formData.notes.trim()
        );
        setNotes((prev) =>
          prev.map((n) =>
            n.id === editingId
              ? {
                  ...n,
                  ds_name: formData.ds_name.trim(),
                  concept_name: formData.concept_name.trim(),
                  notes: formData.notes.trim(),
                  updated_at: new Date().toISOString(),
                }
              : n
          )
        );
      } else {
        const result = await addDSNote(
          formData.ds_name.trim(),
          formData.concept_name.trim(),
          formData.notes.trim()
        );
        // Add the new note to state directly
        if (result.data && result.data.length > 0) {
          setNotes((prev) => [result.data[0], ...prev]);
        }
      }

      // Reset form
      setFormData({ ds_name: "", concept_name: "", notes: "" });
      setIsAddingNote(false);
      setEditingId(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to save note: ${errorMsg}`);
    }
  };

  const handleEdit = (note: DSNote) => {
    setFormData({
      ds_name: note.ds_name,
      concept_name: note.concept_name,
      notes: note.notes,
    });
    setEditingId(note.id);
    setIsAddingNote(true);
  };

  const handleCancel = () => {
    setFormData({ ds_name: "", concept_name: "", notes: "" });
    setEditingId(null);
    setIsAddingNote(false);
    setError(null);
  };

  const handleOpenDetails = (note: DSNote) => {
    setSelectedNote(note);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedNote(null);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    try {
      setError(null);
      await deleteDSNote(deletingId);
      setNotes((prev) => prev.filter((n) => n.id !== deletingId));
      setDeletingId(null);
      if (selectedNote?.id === deletingId) {
        handleCloseDetails();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to delete note: ${errorMsg}`);
    }
  };

  if (!isLoaded) {
    return <div className="text-center p-8 text-slate-600 dark:text-slate-400">Loading DS notes...</div>;
  }

  // Pagination logic
  const filteredNotes = getFilteredNotes();
  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotes = filteredNotes.slice(startIndex, endIndex);

  return (
    <div className="space-y-3 sm:space-y-4">
      <Card className="rounded-xl sm:rounded-[2rem] border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-900/95 shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/30">
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400">Learning Notes</p>
              <CardTitle className="text-lg sm:text-2xl font-semibold text-black dark:text-white">{notes.length} notes</CardTitle>
            </div>
            {!isAddingNote && (
              <Button
                onClick={() => setIsAddingNote(true)}
                className="gap-2 bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20 text-sm py-2 h-auto"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Note</span>
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
          {!isAddingNote && notes.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search DS, concept, or notes..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9 text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                    aria-label="Search learning notes"
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

              {/* Filter Panel */}
              {showFilters && (
                <div className="p-3 sm:p-4 rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-slate-800/50 space-y-3 sm:space-y-4">
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
              )}
            </div>
          )}

          {/* Result Count */}
          {notes.length > 0 && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Showing {paginatedNotes.length} of {filteredNotes.length} notes
              {hasActiveFilters && ` (filtered from ${notes.length} total)`}
            </p>
          )}

          {/* Add/Edit Form */}
          {isAddingNote && (
            <form onSubmit={handleAddOrUpdate} className="space-y-3 sm:space-y-4 p-3 sm:p-4 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/50">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="ds-name" className="text-xs sm:text-sm">
                    Data Structure *
                  </Label>
                  <Input
                    id="ds-name"
                    placeholder="e.g., LinkedLists, Trees, Graphs"
                    value={formData.ds_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        ds_name: e.target.value,
                      }))
                    }
                    className="text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="concept-name" className="text-xs sm:text-sm">
                    Concept/Topic *
                  </Label>
                  <Input
                    id="concept-name"
                    placeholder="e.g., insertAtEnd, deleteNode"
                    value={formData.concept_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        concept_name: e.target.value,
                      }))
                    }
                    className="text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="notes" className="text-xs sm:text-sm">
                  Your Understanding & Feelings *
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Write what you learned, how you felt solving it, any edge cases you discovered..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="min-h-16 text-xs sm:text-sm py-1.5 sm:py-2"
                />
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
                  {editingId ? "Update" : "Add"} Note
                </Button>
              </div>
            </form>
          )}

          {/* Notes Table/Cards */}
          {notes.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-slate-500 dark:text-slate-400">
              <p className="text-xs sm:text-sm">No notes added yet. Start tracking your learning journey!</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-slate-500 dark:text-slate-400">
              <p className="text-xs sm:text-sm">No notes match your search or filters. Try adjusting them.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-300 dark:border-slate-700">
                      <th className="text-left px-3 py-2 sm:px-4 sm:py-3 font-semibold text-slate-700 dark:text-slate-300">Data Structure</th>
                      <th className="text-left px-3 py-2 sm:px-4 sm:py-3 font-semibold text-slate-700 dark:text-slate-300">Concept</th>
                      <th className="text-left px-3 py-2 sm:px-4 sm:py-3 font-semibold text-slate-700 dark:text-slate-300">Notes</th>
                      <th className="text-center px-3 py-2 sm:px-4 sm:py-3 font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedNotes.map((note) => (
                      <tr
                        key={note.id}
                        className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-slate-900 dark:text-slate-100">
                          {note.ds_name}
                        </td>
                        <td
                          onClick={() => handleOpenDetails(note)}
                          className="px-3 py-2 sm:px-4 sm:py-3 font-medium text-slate-900 dark:text-slate-100 cursor-pointer hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
                        >
                          {note.concept_name}
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {note.notes || "-"}
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3">
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            <Button
                              onClick={() => handleEdit(note)}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(note.id)}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-2 sm:space-y-3">
                {paginatedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 sm:p-4 bg-white dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetails(note)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                          {note.ds_name}
                        </p>
                        <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 break-words hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">
                          {note.concept_name}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button
                          onClick={() => handleEdit(note)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(note.id)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    {note.notes && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {note.notes}
                      </p>
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
        <DialogContent className="w-full max-w-[95vw] sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <DialogTitle className="text-base sm:text-lg md:text-xl font-semibold flex-1 pr-2 break-words">
              Note Details
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">
            View and edit your learning note details
          </DialogDescription>

          {selectedNote && (
            <div className="space-y-3 sm:space-y-4 md:space-y-5 pr-0">
              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400 mb-1">
                  Data Structure
                </p>
                <p className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 break-words">
                  {selectedNote.ds_name}
                </p>
              </div>

              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400 mb-1">
                  Concept
                </p>
                <p className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 break-words">
                  {selectedNote.concept_name}
                </p>
              </div>

              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400 mb-2">
                  Your Understanding & Feelings
                </p>
                <p className="text-xs sm:text-sm md:text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words max-h-[40vh] overflow-y-auto">
                  {selectedNote.notes}
                </p>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-500">
                Added: {format(new Date(selectedNote.created_at), "MMMM d, yyyy")}
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <Button
                  onClick={() => {
                    handleCloseDetails();
                    handleEdit(selectedNote);
                  }}
                  className="gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
