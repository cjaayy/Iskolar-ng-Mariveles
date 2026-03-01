/* ================================================================
   PROFILE SECTION
   Student info, academic details, settings, notifications
   ================================================================ */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Edit3, Save, X } from "lucide-react";
import { Card, Button, Input, Breadcrumb } from "@/components/ui";
import { useToast } from "@/components/providers/ToastProvider";
import {
  useSession,
  DEMO_APPLICANT_ID,
} from "@/components/providers/SessionProvider";

/* -- Student form data type -- */
interface StudentForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  gpa: string;
  major: string;
  yearLevel: string;
  studentId: string;
  school: string;
}

/* -- Animations -- */
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

/* ======================== PROFILE PAGE ======================== */

export default function ProfilePage() {
  const { user, loading: sessionLoading, refresh } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);

  // Build empty student form
  const emptyForm: StudentForm = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    gpa: "",
    major: "",
    yearLevel: "",
    studentId: "",
    school: "",
  };

  const [student, setStudent] = useState<StudentForm>(emptyForm);
  const [editData, setEditData] = useState<StudentForm>(emptyForm);

  // Sync state when session loads
  useEffect(() => {
    if (!user) return;
    const form: StudentForm = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.contactNumber ?? "",
      address: user.address ?? "",
      gpa: user.gpa > 0 ? String(user.gpa) : "",
      major: user.course,
      yearLevel: user.yearLevelLabel,
      studentId: user.studentNumber,
      school: user.college,
    };
    setStudent(form);
    setEditData(form);
  }, [user]);

  const handleEdit = () => {
    setEditData(student);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-applicant-id": String(DEMO_APPLICANT_ID),
        },
        body: JSON.stringify({
          firstName: editData.firstName,
          lastName: editData.lastName,
          contactNumber: editData.phone,
          address: editData.address,
        }),
      });
      if (res.ok) {
        setStudent(editData);
        setIsEditing(false);
        addToast("Profile updated successfully!", "success");
        await refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        addToast(body.error ?? "Failed to save. Please try again.", "error");
      }
    } catch {
      addToast("Connection error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(student);
    setIsEditing(false);
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-ocean-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-body text-muted-fg">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Breadcrumb */}
      <motion.div variants={fadeUp}>
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Profile" },
          ]}
        />
      </motion.div>

      {/* Page Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            My Profile
          </h1>
          <p className="font-body text-sm text-muted-fg mt-1">
            Manage your personal information and preferences.
          </p>
        </div>
        {!isEditing ? (
          <Button leftIcon={<Edit3 className="w-4 h-4" />} onClick={handleEdit}>
            Edit Profile
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleCancel}
              leftIcon={<X className="w-4 h-4" />}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              leftIcon={<Save className="w-4 h-4" />}
              isLoading={saving}
            >
              Save Changes
            </Button>
          </div>
        )}
      </motion.div>

      <div className="space-y-6">
        {/* ---- Details ---- */}
        <motion.div variants={fadeUp} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <h3 className="font-heading text-base font-semibold text-foreground flex items-center gap-2 mb-5">
              <User className="w-5 h-5 text-muted-fg" />
              Personal Information
            </h3>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={editData.firstName}
                  onChange={(e) =>
                    setEditData({ ...editData, firstName: e.target.value })
                  }
                />
                <Input
                  label="Last Name"
                  value={editData.lastName}
                  onChange={(e) =>
                    setEditData({ ...editData, lastName: e.target.value })
                  }
                />
                <Input
                  label="Email"
                  type="email"
                  value={editData.email}
                  onChange={(e) =>
                    setEditData({ ...editData, email: e.target.value })
                  }
                  leftIcon={<Mail className="w-4 h-4" />}
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={editData.phone}
                  onChange={(e) =>
                    setEditData({ ...editData, phone: e.target.value })
                  }
                  leftIcon={<Phone className="w-4 h-4" />}
                />
                <Input
                  label="Address"
                  value={editData.address}
                  onChange={(e) =>
                    setEditData({ ...editData, address: e.target.value })
                  }
                  leftIcon={<MapPin className="w-4 h-4" />}
                  className="sm:col-span-2"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <InfoRow
                  icon={<User className="w-4 h-4" />}
                  label="Full Name"
                  value={`${student.firstName} ${student.lastName}`}
                />
                <InfoRow
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  value={student.email}
                />
                <InfoRow
                  icon={<Phone className="w-4 h-4" />}
                  label="Phone"
                  value={student.phone}
                />
                <InfoRow
                  icon={<MapPin className="w-4 h-4" />}
                  label="Address"
                  value={student.address}
                />
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ======================== INFO ROW ======================== */

function InfoRow({
  icon,
  label,
  value,
  className = "",
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {icon && (
        <span className="text-muted-fg mt-0.5 flex-shrink-0">{icon}</span>
      )}
      <div>
        <p className="text-xs font-body text-muted-fg">{label}</p>
        <p className="text-sm font-body font-medium text-foreground mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}
