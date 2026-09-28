"use client";

import { useState, useEffect, useCallback } from "react";

type Member = {
  id: string;
  fullName: string | null;
  email: string;
  role: string;
};

type ActionItem = {
  id: string;
  priority: string;
  category: string;
  title: string;
  whyItMatters: string;
  steps: { order: number; text: string }[];
  effortLevel: string;
  suggestedText: string | null;
  status: string;
  assignedToId: string | null;
  assignedTo: { id: string; fullName: string | null; email: string } | null;
  completedAt: string | null;
  createdAt: string;
};

export function ActionCenter({ clientId }: { clientId: string }) {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ clientId });
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    if (categoryFilter) params.set("category", categoryFilter);

    try {
      const [actionsRes, membersRes] = await Promise.all([
        fetch(`/api/actions?${params}`),
        fetch("/api/team/members"),
      ]);

      if (actionsRes.ok) {
        const data = await actionsRes.json();
        setActions(data.actions);
      }
      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members);
      }
    } finally {
      setLoading(false);
    }
  }, [clientId, statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateAction(
    id: string,
    body: { status?: string; assignedToId?: string | null }
  ) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setActions((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...data.action } : a))
        );
      }
    } finally {
      setUpdatingId(null);
    }
  }

  function copyText(id: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const counts = {
    total: actions.length,
    todo: actions.filter((a) => a.status === "TODO").length,
    inProgress: actions.filter((a) => a.status === "IN_PROGRESS").length,
    done: actions.filter((a) => a.status === "DONE").length,
    high: actions.filter((a) => a.priority === "HIGH" && a.status !== "DONE" && a.status !== "SKIPPED").length,
  };

  const progressPct =
    counts.total === 0
      ? 0
      : Math.round(
          ((counts.done +
            actions.filter((a) => a.status === "SKIPPED").length) /
            counts.total) *
            100
        );

  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-sm text-muted-foreground">
        Loading Action Center…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-medium text-lg">Action Center</h2>
          <p className="text-sm text-muted-foreground">
            {counts.total} actions · {counts.high} open high priority ·{" "}
            {counts.done} done
          </p>
        </div>
        {counts.total > 0 && (
          <div className="w-full sm:w-48">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "All", status: "", priority: "" },
          { label: "To-do", status: "TODO", priority: "" },
          { label: "In progress", status: "IN_PROGRESS", priority: "" },
          { label: "High priority", status: "", priority: "HIGH" },
          { label: "Done", status: "DONE", priority: "" },
        ].map((chip) => {
          const active =
            statusFilter === chip.status && priorityFilter === chip.priority;
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                setStatusFilter(chip.status);
                setPriorityFilter(chip.priority);
              }}
              className={`rounded-full border px-3 py-1 text-xs ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border px-2 py-1.5 text-sm"
        >
          <option value="">All categories</option>
          <option value="TECHNICAL">Technical</option>
          <option value="CONTENT">Content</option>
          <option value="SCHEMA">Schema</option>
          <option value="ENTITY">Entity</option>
          <option value="AUTHORITY">Authority</option>
          <option value="PERFORMANCE">Performance</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {actions.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-muted-foreground">
          No actions yet. Run a scan to generate prioritized AEO recommendations.
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action) => {
            const steps = Array.isArray(action.steps) ? action.steps : [];
            const open = expandedId === action.id;
            return (
              <div
                key={action.id}
                className={`rounded-lg border bg-white p-4 space-y-3 ${
                  action.status === "DONE" ? "opacity-70" : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <PriorityBadge priority={action.priority} />
                  <span className="text-xs rounded bg-gray-100 px-1.5 py-0.5">
                    {action.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    effort: {action.effortLevel.toLowerCase()}
                  </span>
                  {steps.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(open ? null : action.id)
                      }
                      className="text-xs text-primary underline ml-auto"
                    >
                      {open ? "Hide steps" : `${steps.length} steps`}
                    </button>
                  )}
                </div>

                <div>
                  <p
                    className={`font-medium text-sm ${
                      action.status === "DONE" ? "line-through" : ""
                    }`}
                  >
                    {action.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {action.whyItMatters}
                  </p>
                </div>

                {open && steps.length > 0 && (
                  <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
                    {steps
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((s) => (
                        <li key={s.order}>{s.text}</li>
                      ))}
                  </ol>
                )}

                {action.suggestedText && (
                  <div className="rounded-md bg-gray-50 p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="flex-1">
                        <span className="font-medium">Suggested fix: </span>
                        {action.suggestedText}
                      </p>
                      <button
                        onClick={() =>
                          copyText(action.id, action.suggestedText!)
                        }
                        className="shrink-0 text-xs rounded border px-2 py-1 hover:bg-white"
                      >
                        {copiedId === action.id ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <select
                    value={action.status}
                    disabled={updatingId === action.id}
                    onChange={(e) =>
                      updateAction(action.id, { status: e.target.value })
                    }
                    className="rounded-md border px-2 py-1 text-sm"
                  >
                    <option value="TODO">To-do</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="DONE">Done</option>
                    <option value="SKIPPED">Skipped</option>
                  </select>

                  <select
                    value={action.assignedToId || ""}
                    disabled={updatingId === action.id}
                    onChange={(e) =>
                      updateAction(action.id, {
                        assignedToId: e.target.value || null,
                      })
                    }
                    className="rounded-md border px-2 py-1 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName || m.email}
                      </option>
                    ))}
                  </select>

                  {action.status === "DONE" && action.completedAt && (
                    <span className="text-xs text-muted-foreground">
                      Done{" "}
                      {new Date(action.completedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    HIGH: "bg-red-50 text-red-700",
    MEDIUM: "bg-amber-50 text-amber-700",
    LOW: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-medium ${
        colors[priority] || colors.LOW
      }`}
    >
      {priority}
    </span>
  );
}
