"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { getDSNotes, addDSNote, updateDSNote, deleteDSNote, type DSNote } from "@/app/services/dsnotes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Edit2, Search, X } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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
  const itemsPerPage = 12;

  // Form state
  const [formData, setFormData] = useState({
    ds_name: "",
    concept_name: "",
    notes: "",
  });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setIsLoaded(false);
      const res = await getDSNotes();
      setNotes(res.data);
      setError(null);
      setCurrentPage(1);
      setSearchQuery("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load notes";
      setError(msg);
      console.error("Load error:", err);
    } finally {
      setIsLoaded(true);
    }
  };

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;

    const query = searchQuery.toLowerCase();
    return notes.filter((note) =>
      note.ds_name.toLowerCase().includes(query) ||
      note.concept_name.toLowerCase().includes(query) ||
      note.notes.toLowerCase().includes(query)
    );
  }, [notes, searchQuery]);

  const paginatedNotes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredNotes.slice(start, start + itemsPerPage);
  }, [filteredNotes, currentPage]);

  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ds_name.trim() || !formData.concept_name.trim() || !formData.notes.trim()) {
      setError("Please fill all fields");
      return;
    }

    setIsAddingNote(true);
    try {
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
        setEditingId(null);
      } else {
        await addDSNote(formData.ds_name.trim(), formData.concept_name.trim(), formData.notes.trim());
        await loadNotes();
      }

      setFormData({ ds_name: "", concept_name: "", notes: "" });
      setError(null);
      setIsAddingNote(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save note";
      setError(msg);
      setIsAddingNote(false);
    }
  };

  const handleEdit = (note: DSNote) => {
    setFormData({
      ds_name: note.ds_name,
      concept_name: note.concept_name,
      notes: note.notes,
    });
    setEditingId(note.id);
    setDetailsDialogOpen(false);
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

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this note?")) {
      handleDeleteNote(id);
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await deleteDSNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setError(null);
      if (paginatedNotes.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      if (selectedNote?.id === id) {
        handleCloseDetails();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete note";
      setError(msg);
    }
  };

  if (!isLoaded) {
    return <div className="text-center p-8 text-slate-600 dark:text-slate-400">Loading DS notes...</div>;
  }

  return (
    <section className="w-full space-y-6">
      <Card className="rounded-xl sm:rounded-[2rem] border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-900/95 shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/30">
        <CardHeader className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl">Your Learning Notes</CardTitle>
            {!isAddingNote && (
              <Button
                onClick={() => setIsAddingNote(true)}
                className="gap-2 bg-cyan-500 text-white hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Note</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Add/Edit Form - Collapsible */}
          {isAddingNote && (
            <form onSubmit={handleAddOrUpdate} className="space-y-3 sm:space-y-4 p-3 sm:p-4 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/50">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Data Structure
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., LinkedLists, Trees, Graphs"
                    value={formData.ds_name}
                    onChange={(e) => setFormData({ ...formData, ds_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Concept/Topic
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., insertAtEnd, deleteNode"
                    value={formData.concept_name}
                    onChange={(e) => setFormData({ ...formData, concept_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Your Understanding & Feelings
                </label>
                <textarea
                  placeholder="Write what you learned, how you felt solving it, any edge cases you discovered..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs sm:text-sm resize-none"
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
                {searchQuery && (
                  <Button
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Active Search Display */}
              {searchQuery && (
                <div className="flex flex-wrap gap-2 items-center">
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
                </div>
              )}
            </div>
          )}

          {/* Result Count */}
          {notes.length > 0 && !isAddingNote && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Showing {paginatedNotes.length} of {filteredNotes.length} notes
              {searchQuery && ` (filtered from ${notes.length} total)`}
            </p>
          )}

          {/* Notes Grid/List */}
          {filteredNotes.length === 0 && !isAddingNote ? (
            <div className="text-center py-6 sm:py-8 text-slate-500 dark:text-slate-400">
              {searchQuery ? (
                <p className="text-xs sm:text-sm">No notes match your search. Try adjusting your query.</p>
              ) : (
                <p className="text-xs sm:text-sm">No notes added yet. Start tracking your learning journey!</p>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Grid View */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {paginatedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:border-cyan-300 dark:hover:border-cyan-400/50 transition-all cursor-pointer flex flex-col"
                    onClick={() => handleOpenDetails(note)}
                  >
                    <div className="flex-1 min-w-0 mb-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 truncate">
                            {note.ds_name}
                          </p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 break-words line-clamp-2 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">
                            {note.concept_name}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-3">
                        {note.notes}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {format(new Date(note.created_at), "MMM d")}
                      </p>
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
                  </div>
                ))}
              </div>

              {/* Mobile Card View */}
              <div className="space-y-2 sm:space-y-3">
                {paginatedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 sm:p-4 bg-white dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetails(note)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
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
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {note.notes}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                      {format(new Date(note.created_at), "MMM d, yyyy")}
                    </p>
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
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer text-xs sm:text-sm"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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

      {/* Details Dialog */}
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
    </section>
  );
}
