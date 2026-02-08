/**
 * Admin Content Section
 * Lists forum posts and replies with moderation tools.
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, Trash2, MessageSquare, FileText, ExternalLink, Image } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  useAdminContent,
  type ContentFilter,
  type ContentType,
  type AdminContentItem,
} from "../hooks/useAdminContent";
import { removeContent } from "../actions/removeContent.action";

export default function ContentSection() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ContentFilter>("all");
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all");
  const [selectedItem, setSelectedItem] = useState<AdminContentItem | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const { data: content, isLoading } = useAdminContent({ filter, search, type: typeFilter });

  const openDeleteDialog = (item: AdminContentItem) => {
    setSelectedItem(item);
    setReason("");
  };

  const closeDialog = () => {
    setSelectedItem(null);
    setReason("");
  };

  const handleDelete = async () => {
    if (!selectedItem || !reason.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await removeContent(selectedItem.id, selectedItem.type, reason);

      if (result.success) {
        toast.success(
          selectedItem.type === "post"
            ? "Post removed successfully"
            : "Reply removed successfully"
        );
        queryClient.invalidateQueries({ queryKey: ["admin", "content"] });
        closeDialog();
      } else {
        toast.error(result.error || "Failed to remove content");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const truncate = (text: string, length = 100) => {
    if (text.length <= length) return text;
    return text.slice(0, length) + "...";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Moderation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as ContentType | "all")}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="post">📄 Posts</SelectItem>
              <SelectItem value="reply">💬 Replies</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as ContentFilter)}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="recent">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !content?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No content found
                  </TableCell>
                </TableRow>
              ) : (
                content.map((item) => (
                  <TableRow key={`${item.type}-${item.id}`}>
                    <TableCell>
                      {item.type === "post" ? (
                        <Badge variant="secondary" className="gap-1">
                          <FileText className="h-3 w-3" />
                          Post
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Reply
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px]">
                        {item.type === "post" && item.title && (
                          <div className="font-medium truncate">{item.title}</div>
                        )}
                        {item.type === "reply" && item.postTitle && (
                          <div className="text-xs text-muted-foreground mb-1">
                            Re: {truncate(item.postTitle, 40)}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {truncate(item.content)}
                        </div>
                        {item.photos && item.photos.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Image className="h-3 w-3" />
                            {item.photos.length} photo{item.photos.length !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{item.authorName || "Unknown"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {item.createdAt
                          ? format(new Date(item.createdAt), "MMM d, yyyy")
                          : "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.type === "post" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a
                              href={`/community/post/${item.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(item)}
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Remove {selectedItem?.type === "post" ? "Post" : "Reply"}
            </DialogTitle>
            <DialogDescription>
              This will permanently delete this content. This action cannot be undone and is logged for audit.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="py-2 space-y-2">
              {selectedItem.type === "post" && selectedItem.title && (
                <div className="text-sm font-medium">{selectedItem.title}</div>
              )}
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md max-h-32 overflow-y-auto">
                {selectedItem.content}
              </div>
              <div className="text-xs text-muted-foreground">
                By: {selectedItem.authorName || "Unknown"}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for removal (required)</label>
            <Textarea
              placeholder="e.g., Spam, inappropriate content, violates community guidelines..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!reason.trim() || isSubmitting}
            >
              {isSubmitting ? "Removing..." : "Remove Content"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
