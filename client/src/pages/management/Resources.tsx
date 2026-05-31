/**
 * Team Resources — Shared tool links, documents, and SOPs.
 * Central reference hub for the team with Bitwarden integration notes.
 */
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  ExternalLink,
  KeyRound,
  FileText,
  Pencil,
  Trash2,
  Upload,
  X,
  Loader2,
  DollarSign,
  Megaphone,
  Code,
  Scale,
  Truck,
  Settings,
} from "lucide-react";

const CATEGORIES = [
  { value: "finance", label: "Finance", icon: DollarSign, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  { value: "marketing", label: "Marketing", icon: Megaphone, color: "bg-pink-50 border-pink-200 text-pink-700" },
  { value: "tech", label: "Tech", icon: Code, color: "bg-blue-50 border-blue-200 text-blue-700" },
  { value: "legal", label: "Legal", icon: Scale, color: "bg-amber-50 border-amber-200 text-amber-700" },
  { value: "vendors", label: "Vendors", icon: Truck, color: "bg-purple-50 border-purple-200 text-purple-700" },
  { value: "operations", label: "Operations", icon: Settings, color: "bg-slate-50 border-slate-200 text-slate-700" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];

function getCategoryMeta(cat: string) {
  return CATEGORIES.find((c) => c.value === cat) || CATEGORIES[5]; // default to operations
}

export default function Resources() {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: resources, isLoading } = trpc.management.resources.list.useQuery(
    filterCategory !== "all" ? { category: filterCategory as CategoryValue } : undefined
  );

  const utils = trpc.useUtils();

  const createMutation = trpc.management.resources.create.useMutation({
    onSuccess: () => {
      utils.management.resources.list.invalidate();
      setShowAddDialog(false);
      toast.success("Resource added");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.management.resources.update.useMutation({
    onSuccess: () => {
      utils.management.resources.list.invalidate();
      setEditingId(null);
      toast.success("Resource updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.management.resources.delete.useMutation({
    onSuccess: () => {
      utils.management.resources.list.invalidate();
      toast.success("Resource deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadMutation = trpc.management.resources.uploadFile.useMutation({
    onSuccess: () => {
      utils.management.resources.list.invalidate();
      toast.success("File uploaded");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeFileMutation = trpc.management.resources.removeFile.useMutation({
    onSuccess: () => {
      utils.management.resources.list.invalidate();
      toast.success("File removed");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-64" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-lg" />
        ))}
      </div>
    );
  }

  // Group resources by category
  const grouped = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat.value] = (resources || []).filter((r) => r.category === cat.value);
      return acc;
    },
    {} as Record<string, typeof resources>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-slate-700" />
            Team Resources
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Shared tools, documents, and SOPs. Credentials stored in{" "}
            <span className="font-medium text-blue-600">Bitwarden</span>.
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" /> Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Resource</DialogTitle>
            </DialogHeader>
            <ResourceForm
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterCategory("all")}
        >
          All
        </Button>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Button
              key={cat.value}
              variant={filterCategory === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCategory(cat.value)}
              className="gap-1"
            >
              <Icon className="w-3 h-3" />
              {cat.label}
            </Button>
          );
        })}
      </div>

      {/* Resources by Category */}
      {filterCategory === "all" ? (
        CATEGORIES.map((cat) => {
          const items = grouped[cat.value];
          if (!items || items.length === 0) return null;
          return (
            <CategorySection
              key={cat.value}
              category={cat}
              items={items}
              editingId={editingId}
              setEditingId={setEditingId}
              onUpdate={(id, data) => updateMutation.mutate({ id, ...data })}
              onDelete={(id) => {
                if (confirm("Delete this resource?")) deleteMutation.mutate({ id });
              }}
              onUpload={(resourceId, file) => handleFileUpload(resourceId, file)}
              onRemoveFile={(id) => removeFileMutation.mutate({ id })}
              isUpdating={updateMutation.isPending}
            />
          );
        })
      ) : (
        <CategorySection
          category={getCategoryMeta(filterCategory)}
          items={resources || []}
          editingId={editingId}
          setEditingId={setEditingId}
          onUpdate={(id, data) => updateMutation.mutate({ id, ...data })}
          onDelete={(id) => {
            if (confirm("Delete this resource?")) deleteMutation.mutate({ id });
          }}
          onUpload={(resourceId, file) => handleFileUpload(resourceId, file)}
          onRemoveFile={(id) => removeFileMutation.mutate({ id })}
          isUpdating={updateMutation.isPending}
        />
      )}

      {/* Empty state */}
      {(!resources || resources.length === 0) && (
        <div className="text-center py-12 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No resources yet</p>
          <p className="text-sm">Add your first tool, document, or SOP above.</p>
        </div>
      )}
    </div>
  );

  function handleFileUpload(resourceId: number, file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate({
        resourceId,
        fileName: file.name,
        fileData: base64,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
      });
    };
    reader.readAsDataURL(file);
  }
}

// --- Category Section ---
function CategorySection({
  category,
  items,
  editingId,
  setEditingId,
  onUpdate,
  onDelete,
  onUpload,
  onRemoveFile,
  isUpdating,
}: {
  category: (typeof CATEGORIES)[number];
  items: any[];
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  onUpdate: (id: number, data: any) => void;
  onDelete: (id: number) => void;
  onUpload: (resourceId: number, file: File) => void;
  onRemoveFile: (id: number) => void;
  isUpdating: boolean;
}) {
  const Icon = category.icon;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {category.label}
      </h2>
      <div className="grid gap-3">
        {items.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            isEditing={editingId === resource.id}
            onEdit={() => setEditingId(resource.id)}
            onCancelEdit={() => setEditingId(null)}
            onUpdate={(data) => onUpdate(resource.id, data)}
            onDelete={() => onDelete(resource.id)}
            onUpload={(file) => onUpload(resource.id, file)}
            onRemoveFile={() => onRemoveFile(resource.id)}
            isUpdating={isUpdating}
          />
        ))}
      </div>
    </div>
  );
}

// --- Resource Card ---
function ResourceCard({
  resource,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onUpload,
  onRemoveFile,
  isUpdating,
}: {
  resource: any;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  onUpload: (file: File) => void;
  onRemoveFile: () => void;
  isUpdating: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isEditing) {
    return (
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="pt-4">
          <ResourceForm
            initial={resource}
            onSubmit={(data) => onUpdate(data)}
            onCancel={onCancelEdit}
            isLoading={isUpdating}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="py-4 px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-slate-900 truncate">{resource.title}</h3>
              {resource.hasBitwardenCreds === 1 && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  <KeyRound className="w-3 h-3" />
                  Bitwarden
                </span>
              )}
              {resource.fileName && (
                <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  <FileText className="w-3 h-3" />
                  {resource.fileName}
                </span>
              )}
            </div>
            {resource.url && (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
              >
                <ExternalLink className="w-3 h-3" />
                {resource.url.replace(/^https?:\/\//, "").slice(0, 60)}
              </a>
            )}
            {resource.notes && (
              <p className="text-sm text-slate-500 mt-1.5 whitespace-pre-wrap">{resource.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = "";
              }}
            />
            {!resource.fileName && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
              >
                <Upload className="w-4 h-4 text-slate-400" />
              </Button>
            )}
            {resource.fileName && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemoveFile}
                title="Remove file"
              >
                <X className="w-4 h-4 text-slate-400" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onEdit} title="Edit">
              <Pencil className="w-4 h-4 text-slate-400" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} title="Delete">
              <Trash2 className="w-4 h-4 text-red-400" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Resource Form (create/edit) ---
function ResourceForm({
  initial,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initial?: any;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  isLoading: boolean;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [url, setUrl] = useState(initial?.url || "");
  const [category, setCategory] = useState<string>(initial?.category || "operations");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [hasBitwardenCreds, setHasBitwardenCreds] = useState(
    initial?.hasBitwardenCreds === 1 || initial?.hasBitwardenCreds === true || false
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    onSubmit({
      title: title.trim(),
      url: url.trim() || undefined,
      category,
      notes: notes.trim() || undefined,
      hasBitwardenCreds,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Stripe Dashboard"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://dashboard.stripe.com"
          />
        </div>
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasBitwardenCreds}
              onChange={(e) => setHasBitwardenCreds(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-600 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              Credentials in Bitwarden
            </span>
          </label>
        </div>
        <div className="col-span-2">
          <Label htmlFor="notes">Notes / SOP</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How to use this tool, who manages it, any important notes..."
            rows={3}
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
          {initial ? "Save Changes" : "Add Resource"}
        </Button>
      </div>
    </form>
  );
}
