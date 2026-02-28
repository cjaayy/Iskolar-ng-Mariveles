/* ================================================================
   PROFILE SECTION
   Student info, academic details, settings, notifications
   ================================================================ */

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Save,
  X,
  Bell,
  BellOff,
  Shield,
  Link2,
  Camera,
  Award,
} from "lucide-react";
import {
  Card,
  Button,
  Input,
  Toggle,
  Badge,
  ProgressBar,
  Breadcrumb,
  CircularProgress,
} from "@/components/ui";
import { useToast } from "@/components/providers/ToastProvider";
import { WavySeparator } from "@/components/illustrations";

/* -- Mock student data -- */
const initialStudent = {
  firstName: "Maria",
  lastName: "Santos",
  email: "maria.santos@student.edu.ph",
  phone: "+63 917 123 4567",
  address: "Brgy. San Isidro, Mariveles, Bataan",
  gpa: "1.45",
  major: "Bachelor of Science in Information Technology",
  yearLevel: "3rd Year",
  studentId: "2023-00142",
  school: "Mariveles National High School - College Dept.",
};

const linkedScholarships = [
  {
    name: "Iskolar ng Mariveles",
    status: "active" as const,
    award: "Full Tuition",
  },
  {
    name: "DOST-SEI Merit Scholarship",
    status: "active" as const,
    award: "Stipend + Tuition",
  },
  {
    name: "Barangay Scholarship",
    status: "expired" as const,
    award: "Book Allowance",
  },
];

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
  const [isEditing, setIsEditing] = useState(false);
  const [student, setStudent] = useState(initialStudent);
  const [editData, setEditData] = useState(initialStudent);
  const { addToast } = useToast();

  /* Notification settings */
  const [notifications, setNotifications] = useState({
    emailDeadlines: true,
    emailUpdates: true,
    smsReminders: false,
    pushNotifications: true,
    weeklyDigest: true,
    marketingEmails: false,
  });

  const handleEdit = () => {
    setEditData(student);
    setIsEditing(true);
  };

  const handleSave = () => {
    setStudent(editData);
    setIsEditing(false);
    addToast("Profile updated successfully!", "success");
  };

  const handleCancel = () => {
    setEditData(student);
    setIsEditing(false);
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      addToast(
        `${key.replace(/([A-Z])/g, " $1").toLowerCase()} ${updated[key] ? "enabled" : "disabled"}`,
        updated[key] ? "info" : "warning",
      );
      return updated;
    });
  };

  const profileCompletion = 72;

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
            >
              Save Changes
            </Button>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---- Left Column: Profile Card ---- */}
        <motion.div variants={fadeUp} className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card className="text-center relative overflow-hidden">
            {/* Gradient banner */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-ocean-400 to-peach-300 rounded-t-2xl" />

            {/* Avatar */}
            <div className="relative pt-10 pb-2">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-ocean-300 to-peach-300 flex items-center justify-center text-3xl font-heading font-bold text-white border-4 border-card-bg shadow-soft">
                  {student.firstName[0]}
                  {student.lastName[0]}
                </div>
                {isEditing && (
                  <button
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-ocean-400 text-white flex items-center justify-center shadow-soft hover:bg-ocean-500 transition-colors"
                    aria-label="Change photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <h2 className="font-heading text-xl font-bold text-foreground mt-2">
              {student.firstName} {student.lastName}
            </h2>
            <p className="font-body text-sm text-muted-fg">
              {student.studentId}
            </p>
            <Badge variant="info" dot className="mt-2">
              {student.yearLevel}
            </Badge>

            {/* Profile completion */}
            <div className="mt-6 pt-4 border-t border-card-border">
              <CircularProgress
                value={profileCompletion}
                size={70}
                strokeWidth={6}
              >
                <span className="text-sm font-heading font-bold text-foreground">
                  {profileCompletion}%
                </span>
              </CircularProgress>
              <p className="text-xs font-body text-muted-fg mt-2">
                Profile Completion
              </p>
              <ProgressBar
                value={profileCompletion}
                size="sm"
                showValue={false}
                color="ocean"
                className="mt-2"
              />
            </div>
          </Card>

          {/* Linked Scholarships */}
          <Card>
            <h3 className="font-heading text-base font-semibold text-foreground flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-400" />
              Linked Scholarships
            </h3>
            <div className="space-y-3">
              {linkedScholarships.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-body text-sm font-medium text-foreground">
                      {s.name}
                    </p>
                    <p className="text-xs font-body text-muted-fg mt-0.5">
                      {s.award}
                    </p>
                  </div>
                  <Badge
                    variant={s.status === "active" ? "success" : "neutral"}
                    dot
                  >
                    {s.status === "active" ? "Active" : "Expired"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* ---- Right Column: Details ---- */}
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <h3 className="font-heading text-base font-semibold text-foreground flex items-center gap-2 mb-5">
              <User className="w-5 h-5 text-ocean-400" />
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

          {/* Academic Information */}
          <Card>
            <h3 className="font-heading text-base font-semibold text-foreground flex items-center gap-2 mb-5">
              <GraduationCap className="w-5 h-5 text-peach-400" />
              Academic Information
            </h3>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Student ID"
                  value={editData.studentId}
                  disabled
                  hint="Student ID cannot be changed"
                />
                <Input
                  label="GPA"
                  value={editData.gpa}
                  onChange={(e) =>
                    setEditData({ ...editData, gpa: e.target.value })
                  }
                />
                <Input
                  label="Course / Major"
                  value={editData.major}
                  onChange={(e) =>
                    setEditData({ ...editData, major: e.target.value })
                  }
                  className="sm:col-span-2"
                />
                <Input
                  label="Year Level"
                  value={editData.yearLevel}
                  onChange={(e) =>
                    setEditData({ ...editData, yearLevel: e.target.value })
                  }
                />
                <Input
                  label="School"
                  value={editData.school}
                  onChange={(e) =>
                    setEditData({ ...editData, school: e.target.value })
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow
                  icon={<Shield className="w-4 h-4" />}
                  label="Student ID"
                  value={student.studentId}
                />
                <InfoRow
                  label="GPA"
                  value={student.gpa}
                  icon={
                    <span className="w-4 h-4 rounded-full bg-sage-100 dark:bg-sage-500/10 flex items-center justify-center text-[10px] font-bold text-sage-500">
                      A
                    </span>
                  }
                />
                <InfoRow
                  icon={<GraduationCap className="w-4 h-4" />}
                  label="Course"
                  value={student.major}
                  className="sm:col-span-2"
                />
                <InfoRow label="Year Level" value={student.yearLevel} />
                <InfoRow
                  icon={<Link2 className="w-4 h-4" />}
                  label="School"
                  value={student.school}
                />
              </div>
            )}
          </Card>

          <WavySeparator />

          {/* Notification Settings */}
          <Card>
            <h3 className="font-heading text-base font-semibold text-foreground flex items-center gap-2 mb-5">
              <Bell className="w-5 h-5 text-amber-400" />
              Notification Preferences
            </h3>

            <div className="space-y-4">
              <NotificationToggle
                label="Deadline Reminders"
                description="Get notified before document deadlines"
                checked={notifications.emailDeadlines}
                onChange={() => handleNotificationChange("emailDeadlines")}
                icon={<Bell className="w-4 h-4 text-coral-400" />}
              />
              <NotificationToggle
                label="Application Updates"
                description="Notifications when documents are reviewed"
                checked={notifications.emailUpdates}
                onChange={() => handleNotificationChange("emailUpdates")}
                icon={<Mail className="w-4 h-4 text-ocean-400" />}
              />
              <NotificationToggle
                label="SMS Reminders"
                description="Receive text message alerts for urgent deadlines"
                checked={notifications.smsReminders}
                onChange={() => handleNotificationChange("smsReminders")}
                icon={<Phone className="w-4 h-4 text-sage-400" />}
              />
              <NotificationToggle
                label="Push Notifications"
                description="Browser push notifications for real-time updates"
                checked={notifications.pushNotifications}
                onChange={() => handleNotificationChange("pushNotifications")}
                icon={<Bell className="w-4 h-4 text-peach-400" />}
              />
              <NotificationToggle
                label="Weekly Digest"
                description="Summary of your scholarship progress every Monday"
                checked={notifications.weeklyDigest}
                onChange={() => handleNotificationChange("weeklyDigest")}
                icon={<Mail className="w-4 h-4 text-amber-400" />}
              />
              <NotificationToggle
                label="Marketing & Tips"
                description="Scholarship tips, events, and opportunities"
                checked={notifications.marketingEmails}
                onChange={() => handleNotificationChange("marketingEmails")}
                icon={<BellOff className="w-4 h-4 text-muted-fg" />}
              />
            </div>
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

/* ======================== NOTIFICATION TOGGLE ======================== */

function NotificationToggle({
  label,
  description,
  checked,
  onChange,
  icon,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors -mx-3">
      <div className="flex items-start gap-3">
        {icon && <span className="mt-0.5 flex-shrink-0">{icon}</span>}
        <div>
          <p className="font-body text-sm font-medium text-foreground">
            {label}
          </p>
          <p className="font-body text-xs text-muted-fg mt-0.5">
            {description}
          </p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}
