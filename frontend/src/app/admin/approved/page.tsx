"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Users,
} from "lucide-react";
import { Card, Badge, Skeleton, Button } from "@/components/ui";
import { useToast } from "@/components/providers/ToastProvider";

interface ApprovedApplicant {
  application_id: number;
  applicant_id: number;
  applicant_name: string;
  email: string;
  barangay: string | null;
  contact_number: string | null;
  submitted_at: string | null;
  approved_requirements: number;
  total_requirements: number;
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function generateExcel(applicants: ApprovedApplicant[]): string {
  const headers = ["No.", "Full Name", "Email", "Barangay", "Contact Number"];

  const tableRows = applicants
    .map(
      (a, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${a.applicant_name}</td>
      <td>${a.email}</td>
      <td>${a.barangay || "—"}</td>
      <td>${a.contact_number || "—"}</td>
    </tr>`,
    )
    .join("");

  return `
    <html xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head>
      <meta charset="UTF-8">
      <style>
        table { border-collapse: collapse; width: 100%; }
        th { background: #1a7a5e; color: white; padding: 8px; border: 1px solid #ccc; text-align: left; }
        td { padding: 8px; border: 1px solid #ccc; }
        tr:nth-child(even) { background: #f9fafb; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </body>
    </html>
  `;
}

function downloadPDF(applicants: ApprovedApplicant[]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const tableRows = applicants
    .map(
      (a, i) => `
    <tr>
      <td style="border:1px solid #ccc;padding:6px 10px;text-align:center">${i + 1}</td>
      <td style="border:1px solid #ccc;padding:6px 10px">${a.applicant_name}</td>
      <td style="border:1px solid #ccc;padding:6px 10px">${a.email}</td>

      <td style="border:1px solid #ccc;padding:6px 10px">${a.barangay || "—"}</td>
      <td style="border:1px solid #ccc;padding:6px 10px">${a.contact_number || "—"}</td>
    </tr>`,
    )
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Approved Applicants — Iskolar ng Mariveles</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p.subtitle { color: #666; font-size: 13px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #1a7a5e; color: white; padding: 8px 10px; border: 1px solid #ccc; text-align: left; }
        tr:nth-child(even) { background: #f9fafb; }
        .footer { margin-top: 20px; font-size: 11px; color: #999; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <h1>List of Approved Applicants</h1>
      <p class="subtitle">Iskolar ng Mariveles Scholarship Program &mdash; Generated: ${new Date().toLocaleDateString()}</p>
      <p class="subtitle">Total Approved: ${applicants.length}</p>
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Barangay</th>
            <th>Contact</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="footer">
        Iskolar ng Mariveles &copy; ${new Date().getFullYear()} — This document is system-generated.
      </div>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

export default function ApprovedApplicantsPage() {
  const { addToast } = useToast();
  const [applicants, setApplicants] = useState<ApprovedApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      const adminId = localStorage.getItem("adminId") || "";
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/approved?${params.toString()}`, {
        headers: { "x-admin-id": adminId },
      });
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setApplicants(json.data || []);
    } catch {
      addToast("Failed to load approved applicants", "error");
    } finally {
      setLoading(false);
    }
  }, [search, addToast]);

  useEffect(() => {
    setLoading(true);
    const debounce = setTimeout(() => loadData(), 300);
    return () => clearTimeout(debounce);
  }, [loadData]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownloadExcel = () => {
    if (applicants.length === 0) {
      addToast("No data to download", "warning");
      return;
    }
    const html = generateExcel(applicants);
    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Approved_Applicants_${new Date().toISOString().split("T")[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    setShowDropdown(false);
    addToast("Excel/CSV file downloaded", "success");
  };

  const handleDownloadPDF = () => {
    if (applicants.length === 0) {
      addToast("No data to download", "warning");
      return;
    }
    downloadPDF(applicants);
    setShowDropdown(false);
    addToast("PDF generated", "success");
  };

  if (loading && applicants.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full max-w-md" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.06 } },
      }}
    >
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-7 h-7 text-green-500" />
            Approved Applicants
          </h1>
          <p className="text-sm text-muted-fg mt-1">
            Applicants with all requirements fully approved and validated
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="success"
              size="sm"
              onClick={() => setShowDropdown((v) => !v)}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download
            </Button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-card-bg border border-card-border shadow-lg z-50 overflow-hidden">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-body text-foreground hover:bg-muted transition-colors"
                >
                  <FileText className="w-4 h-4 text-red-500" />
                  Download as PDF
                </button>
                <button
                  onClick={handleDownloadExcel}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-body text-foreground hover:bg-muted transition-colors border-t border-card-border"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  Download as Excel
                </button>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLoading(true);
              loadData();
            }}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className="flex items-center gap-4 p-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold text-foreground">
              {applicants.length}
            </p>
            <p className="text-sm font-body text-muted-fg">
              Total Approved Scholars
            </p>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-input-bg border-2 border-input-border rounded-xl text-sm font-body text-foreground
              focus:outline-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/20 transition-all"
          />
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className="overflow-x-auto">
          {applicants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="w-16 h-16 text-muted-fg/30 mb-4" />
              <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                No approved applicants yet
              </h3>
              <p className="text-sm text-muted-fg max-w-sm">
                Applicants will appear here once all their requirements have
                been approved by validators.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="text-left px-4 py-3 text-muted-fg font-medium">
                    #
                  </th>
                  <th className="text-left px-4 py-3 text-muted-fg font-medium">
                    Full Name
                  </th>
                  <th className="text-left px-4 py-3 text-muted-fg font-medium hidden sm:table-cell">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-muted-fg font-medium hidden lg:table-cell">
                    Barangay
                  </th>
                  <th className="text-left px-4 py-3 text-muted-fg font-medium hidden md:table-cell">
                    Contact
                  </th>
                  <th className="text-center px-4 py-3 text-muted-fg font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((a, idx) => (
                  <tr
                    key={a.application_id}
                    className="border-b border-card-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-fg">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {a.applicant_name}
                    </td>
                    <td className="px-4 py-3 text-muted-fg hidden sm:table-cell">
                      {a.email}
                    </td>
                    <td className="px-4 py-3 text-muted-fg hidden lg:table-cell">
                      {a.barangay || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-fg hidden md:table-cell">
                      {a.contact_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="success">Approved</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
