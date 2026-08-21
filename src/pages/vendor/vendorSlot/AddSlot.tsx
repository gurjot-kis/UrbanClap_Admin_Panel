import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  HiArrowLeft,
  HiCalendar,
  HiCheckCircle,
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight,
  HiClock,
  HiLocationMarker,
  HiSearch,
  HiTag,
} from "react-icons/hi";
import { HiCheck } from "react-icons/hi2";
import { useAddVendorSlotMutation } from "../../../features/vendor/vendorApi";
import { useGetActiveCategoriesQuery } from "../../../features/category/categoryApi";
import { flattenForParentOptions } from "../../../features/category/categoryHelpers";
import type { FlatCategoryOption } from "../../../features/category/categoryTypes";
import "../../../styles/vendor/AddSlot.css";

interface SlotFormState {
  category_id: string;
  date: string;
  startTime: string;
  endTime: string;
  longitude: string;
  latitude: string;
}

const initialState: SlotFormState = {
  category_id: "",
  date: "",
  startTime: "",
  endTime: "",
  longitude: "",
  latitude: "",
};

const todayStr = () => new Date().toISOString().split("T")[0];

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const COORD_LAT_RE = /^-?(([0-8]?\d(\.\d+)?)|90(\.0+)?)$/;
const COORD_LNG_RE = /^-?((1[0-7]\d|\d{1,2})(\.\d+)?|180(\.0+)?)$/;

const minutesOf = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const Spinner: React.FC = () => <span className="as-spinner" aria-hidden />;

interface DatePickerProps {
  value: string;
  onChange: (val: string) => void;
  min?: string;
  invalid?: boolean;
  onBlur?: () => void;
}

interface TimePickerProps {
  value: string;
  onChange: (val: string) => void;
  invalid?: boolean;
  onBlur?: () => void;
  placeholder?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  min,
  invalid,
  onBlur,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(
    value ? parseInt(value.split("-")[0]) : today.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    value ? parseInt(value.split("-")[1]) - 1 : today.getMonth(),
  );

  const minDate = min ? new Date(min + "T00:00:00") : null;

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const selectDay = (day: number) => {
    const d = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(d);
    setOpen(false);
    onBlur?.();
  };

  const isDisabled = (day: number) => {
    if (!minDate) return false;
    const d = new Date(viewYear, viewMonth, day);
    return d < minDate;
  };

  const isSelected = (day: number) => {
    return (
      value ===
      `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    );
  };

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const displayValue = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className={`as-picker-root ${invalid ? "is-invalid" : ""}`} ref={ref}>
      <button
        type="button"
        className={`as-picker-trigger ${open ? "is-open" : ""} ${invalid ? "is-invalid" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <HiCalendar className="as-picker-icon" />
        <span
          className={displayValue ? "as-picker-value" : "as-picker-placeholder"}
        >
          {displayValue ?? "Select a date"}
        </span>
        <HiChevronDown
          className={`as-picker-chevron ${open ? "rotated" : ""}`}
        />
      </button>

      {open && (
        <div className="as-calendar-popup">
          <div className="as-cal-header">
            <button type="button" className="as-cal-nav" onClick={prevMonth}>
              <HiChevronLeft />
            </button>
            <span className="as-cal-month">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" className="as-cal-nav" onClick={nextMonth}>
              <HiChevronRight />
            </button>
          </div>
          <div className="as-cal-grid">
            {DAYS.map((d) => (
              <div key={d} className="as-cal-day-label">
                {d}
              </div>
            ))}
            {cells.map((day, i) =>
              day === null ? (
                <div key={`e-${i}`} />
              ) : (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled(day)}
                  className={`as-cal-day ${isSelected(day) ? "selected" : ""} ${isToday(day) ? "today" : ""} ${isDisabled(day) ? "disabled" : ""}`}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  invalid,
  onBlur,
  placeholder = "HH : MM",
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);

  const selectedHour = value ? parseInt(value.split(":")[0]) : -1;
  const selectedMin = value ? parseInt(value.split(":")[1]) : -1;

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const selectTime = (h: number, m: number) => {
    const t = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    onChange(t);
  };

  const handleHour = (h: number) => {
    const m = selectedMin >= 0 ? selectedMin : 0;
    selectTime(h, m);
  };

  const handleMin = (m: number) => {
    const h = selectedHour >= 0 ? selectedHour : 8;
    selectTime(h, m);
    setOpen(false);
    onBlur?.();
  };

  // Scroll selected into view
  React.useEffect(() => {
    if (!open) return;
    if (selectedHour >= 0 && hourRef.current) {
      const el = hourRef.current.querySelector(
        `[data-h="${selectedHour}"]`,
      ) as HTMLElement;
      el?.scrollIntoView({ block: "center" });
    }
    if (selectedMin >= 0 && minRef.current) {
      const el = minRef.current.querySelector(
        `[data-m="${selectedMin}"]`,
      ) as HTMLElement;
      el?.scrollIntoView({ block: "center" });
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const fmt12 = (h: number) => {
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12} ${period}`;
  };

  return (
    <div className={`as-picker-root ${invalid ? "is-invalid" : ""}`} ref={ref}>
      <button
        type="button"
        className={`as-picker-trigger ${open ? "is-open" : ""} ${invalid ? "is-invalid" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <HiClock className="as-picker-icon" />
        <span className={value ? "as-picker-value" : "as-picker-placeholder"}>
          {value || placeholder}
        </span>
        <HiChevronDown
          className={`as-picker-chevron ${open ? "rotated" : ""}`}
        />
      </button>

      {open && (
        <div className="as-time-popup">
          <div className="as-time-popup-header">
            <span>Hour</span>
            <span>Minute</span>
          </div>
          <div className="as-time-columns">
            <div className="as-time-col" ref={hourRef}>
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  data-h={h}
                  className={`as-time-opt ${selectedHour === h ? "selected" : ""}`}
                  onClick={() => handleHour(h)}
                >
                  {fmt12(h)}
                </button>
              ))}
            </div>
            <div className="as-time-col" ref={minRef}>
              {minutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  data-m={m}
                  className={`as-time-opt ${selectedMin === m ? "selected" : ""}`}
                  onClick={() => handleMin(m)}
                >
                  :{String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
          {value && (
            <div className="as-time-popup-footer">
              <span className="as-time-selected-display">{value}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface CategorySelectProps {
  options: FlatCategoryOption[];
  value: string;
  onChange: (id: string) => void;
  loading?: boolean;
  errored?: boolean;
  invalid?: boolean;
}

const CategorySelect: React.FC<CategorySelectProps> = ({
  options,
  value,
  onChange,
  loading,
  errored,
  invalid,
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  const selected = useMemo(
    () => options.find((o) => o._id === value),
    [options, value],
  );

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (loading) return <div className="as-cat-status">Loading categories…</div>;
  if (errored)
    return (
      <div className="as-field-error">
        Couldn't load categories. Refresh the page.
      </div>
    );

  return (
    <div className={`as-cat-root ${invalid ? "is-invalid" : ""}`} ref={ref}>
      <button
        type="button"
        className={`as-picker-trigger ${open ? "is-open" : ""} ${invalid ? "is-invalid" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <HiTag className="as-picker-icon" />
        {selected ? (
          <span className="as-picker-value">{selected.name}</span>
        ) : (
          <span className="as-picker-placeholder">
            Select a service category
          </span>
        )}
        <HiChevronDown
          className={`as-picker-chevron ${open ? "rotated" : ""}`}
        />
      </button>

      {open && (
        <div className="as-cat-dropdown" role="listbox">
          <div className="as-cat-search-wrap">
            <HiSearch className="as-cat-search-icon" />
            <input
              autoFocus
              type="text"
              placeholder="Search categories…"
              className="as-cat-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ul className="as-cat-list">
            {filtered.map((opt) => {
              const isSel = opt._id === value;
              return (
                <li
                  key={opt._id}
                  className={`as-cat-item ${isSel ? "is-selected" : ""}`}
                  style={{ paddingLeft: `${14 + opt.depth * 16}px` }}
                  role="option"
                  aria-selected={isSel}
                  onClick={() => {
                    onChange(opt._id);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {opt.depth > 0 && (
                    <span className="as-cat-branch" aria-hidden>
                      └{" "}
                    </span>
                  )}
                  <span className="as-cat-item-name">{opt.name}</span>
                  <span className="as-cat-item-level">L{opt.level}</span>
                  {isSel && <HiCheck className="as-cat-item-check" />}
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="as-cat-empty">No matching categories</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const TimeRangeBar: React.FC<{ start: string; end: string }> = ({
  start,
  end,
}) => {
  if (!start || !end) return null;
  const s = minutesOf(start);
  const e = minutesOf(end);
  if (e <= s) return null;
  const dayStart = 7 * 60,
    dayEnd = 23 * 60,
    range = dayEnd - dayStart;
  const left = Math.max(0, ((s - dayStart) / range) * 100);
  const width = Math.min(100 - left, ((e - s) / range) * 100);
  const duration = e - s;

  return (
    <div className="as-time-bar-wrap">
      <div className="as-time-bar-track">
        <div
          className="as-time-bar-fill"
          style={{ left: `${left}%`, width: `${width}%` }}
        />
      </div>
      <div className="as-time-bar-labels">
        <span>07:00</span>
        <span className="as-time-bar-duration">{duration} min slot</span>
        <span>23:00</span>
      </div>
    </div>
  );
};

const StepBadge: React.FC<{ n: number; done: boolean }> = ({ n, done }) => (
  <div className={`as-step-badge ${done ? "done" : ""}`}>
    {done ? <HiCheck size={13} /> : n}
  </div>
);

/* ------------------------------------------------------------------ */
/* Main Component                                                      */
/* ------------------------------------------------------------------ */

const AddSlot: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<SlotFormState>(initialState);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [addVendorSlot, { isLoading: isSubmitting }] =
    useAddVendorSlotMutation();
  const {
    data: categoriesRes,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useGetActiveCategoriesQuery();

  const categoryOptions: FlatCategoryOption[] = useMemo(
    () => flattenForParentOptions(categoriesRes?.data ?? []),
    [categoriesRes],
  );

  /* Validation */
  const errors = {
    category_id:
      touched.category_id && !form.category_id
        ? "Select a service category."
        : "",
    date: !touched.date
      ? ""
      : !form.date
        ? "Date is required."
        : form.date < todayStr()
          ? "Date cannot be in the past."
          : "",
    startTime: !touched.startTime
      ? ""
      : !form.startTime
        ? "Start time is required."
        : !TIME_RE.test(form.startTime)
          ? "Enter a valid time."
          : "",
    endTime: !touched.endTime
      ? ""
      : !form.endTime
        ? "End time is required."
        : !TIME_RE.test(form.endTime)
          ? "Enter a valid time."
          : form.startTime &&
              minutesOf(form.endTime) <= minutesOf(form.startTime)
            ? "End must be after start."
            : minutesOf(form.endTime) - minutesOf(form.startTime) < 15
              ? "Minimum 15-minute slot."
              : "",
    latitude: !touched.latitude
      ? ""
      : !form.latitude
        ? "Latitude is required."
        : !COORD_LAT_RE.test(form.latitude)
          ? "Valid range: −90 to 90."
          : "",
    longitude: !touched.longitude
      ? ""
      : !form.longitude
        ? "Longitude is required."
        : !COORD_LNG_RE.test(form.longitude)
          ? "Valid range: −180 to 180."
          : "",
  };

  const isFormValid =
    !!form.category_id &&
    !!form.date &&
    form.date >= todayStr() &&
    TIME_RE.test(form.startTime) &&
    TIME_RE.test(form.endTime) &&
    minutesOf(form.endTime) > minutesOf(form.startTime) &&
    minutesOf(form.endTime) - minutesOf(form.startTime) >= 15 &&
    COORD_LAT_RE.test(form.latitude) &&
    COORD_LNG_RE.test(form.longitude);

  const step1Done = !!form.category_id;
  const step2Done =
    !!form.date &&
    TIME_RE.test(form.startTime) &&
    TIME_RE.test(form.endTime) &&
    minutesOf(form.endTime) > minutesOf(form.startTime);
  const step3Done =
    COORD_LAT_RE.test(form.latitude) && COORD_LNG_RE.test(form.longitude);

  const markAllTouched = () =>
    setTouched({
      category_id: true,
      date: true,
      startTime: true,
      endTime: true,
      latitude: true,
      longitude: true,
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    markAllTouched();
    if (!isFormValid) return;
    const payload = {
      category_id: form.category_id,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      location: {
        coordinates: [
          parseFloat(form.longitude),
          parseFloat(form.latitude),
        ] as [number, number],
      },
    };
    try {
      await addVendorSlot(payload).unwrap();
      toast.success("Slot created", {
        description: `${form.date} · ${form.startTime}–${form.endTime}`,
      });
      navigate(-1);
    } catch (err: any) {
      toast.error("Failed to create slot", {
        description: err?.data?.message ?? "Something went wrong. Try again.",
      });
    }
  };

  const selectedCategory = categoryOptions.find(
    (o) => o._id === form.category_id,
  );
  const slotDuration =
    form.startTime &&
    form.endTime &&
    TIME_RE.test(form.startTime) &&
    TIME_RE.test(form.endTime)
      ? Math.max(0, minutesOf(form.endTime) - minutesOf(form.startTime))
      : 0;

  return (
    <div className="as-page">
      <div className="as-container">
        {/* ── Header ── */}
        <div className="as-header">
          <button
            type="button"
            className="as-back-btn"
            onClick={() => navigate(-1)}
          >
            <HiArrowLeft size={16} />
            Back to Slots
          </button>
          <div className="as-header-content">
            <div>
              <p className="as-eyebrow">Vendor Management</p>
              <h1 className="as-title">Add Availability Slot</h1>
              <p className="as-subtitle">
                Define a time window when the vendor is available for bookings.
              </p>
            </div>
            {/* Progress pills */}
            <div className="as-progress-pills">
              <div className={`as-pill ${step1Done ? "done" : ""}`}>
                <StepBadge n={1} done={step1Done} />
                Category
              </div>
              <div className="as-pill-connector" />
              <div className={`as-pill ${step2Done ? "done" : ""}`}>
                <StepBadge n={2} done={step2Done} />
                Schedule
              </div>
              <div className="as-pill-connector" />
              <div className={`as-pill ${step3Done ? "done" : ""}`}>
                <StepBadge n={3} done={step3Done} />
                Location
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <fieldset className="as-fieldset" disabled={isSubmitting}>
            <div className="as-layout">
              {/* ── LEFT ── */}
              <div className="as-form-col">
                {/* 01 Category */}
                <div className="as-card">
                  <div className="as-card-header">
                    <div
                      className="as-card-icon-wrap"
                      style={{ "--icon-hue": "262deg" } as React.CSSProperties}
                    >
                      <HiTag size={18} />
                    </div>
                    <div>
                      <h2 className="as-card-title">Service Category</h2>
                      <p className="as-card-desc">
                        Which service does this slot cover?
                      </p>
                    </div>
                  </div>
                  <div className="as-field">
                    <label className="as-label">Category</label>
                    <CategorySelect
                      options={categoryOptions}
                      value={form.category_id}
                      onChange={(id) => {
                        setForm((p) => ({ ...p, category_id: id }));
                        setTouched((t) => ({ ...t, category_id: true }));
                      }}
                      loading={categoriesLoading}
                      errored={categoriesError}
                      invalid={!!errors.category_id}
                    />
                    {errors.category_id && (
                      <p className="as-field-error">{errors.category_id}</p>
                    )}
                  </div>
                </div>

                {/* 02 Schedule */}
                <div className="as-card">
                  <div className="as-card-header">
                    <div
                      className="as-card-icon-wrap"
                      style={{ "--icon-hue": "220deg" } as React.CSSProperties}
                    >
                      <HiCalendar size={18} />
                    </div>
                    <div>
                      <h2 className="as-card-title">Schedule</h2>
                      <p className="as-card-desc">
                        Set the date and time window for this slot.
                      </p>
                    </div>
                  </div>

                  <div className="as-field">
                    <label className="as-label">Date</label>
                    <DatePicker
                      value={form.date}
                      min={todayStr()}
                      invalid={!!errors.date}
                      onChange={(v) => setForm((p) => ({ ...p, date: v }))}
                      onBlur={() => setTouched((t) => ({ ...t, date: true }))}
                    />
                    {errors.date && (
                      <p className="as-field-error">{errors.date}</p>
                    )}
                  </div>

                  <div className="as-row-2">
                    <div className="as-field">
                      <label className="as-label">Start Time</label>
                      <TimePicker
                        value={form.startTime}
                        invalid={!!errors.startTime}
                        placeholder="Start time"
                        onChange={(v) =>
                          setForm((p) => ({ ...p, startTime: v }))
                        }
                        onBlur={() =>
                          setTouched((t) => ({ ...t, startTime: true }))
                        }
                      />
                      {errors.startTime && (
                        <p className="as-field-error">{errors.startTime}</p>
                      )}
                    </div>
                    <div className="as-field">
                      <label className="as-label">End Time</label>
                      <TimePicker
                        value={form.endTime}
                        invalid={!!errors.endTime}
                        placeholder="End time"
                        onChange={(v) => setForm((p) => ({ ...p, endTime: v }))}
                        onBlur={() =>
                          setTouched((t) => ({ ...t, endTime: true }))
                        }
                      />
                      {errors.endTime && (
                        <p className="as-field-error">{errors.endTime}</p>
                      )}
                    </div>
                  </div>

                  <TimeRangeBar start={form.startTime} end={form.endTime} />
                </div>

                {/* 03 Location */}
                <div className="as-card">
                  <div className="as-card-header">
                    <div
                      className="as-card-icon-wrap"
                      style={{ "--icon-hue": "160deg" } as React.CSSProperties}
                    >
                      <HiLocationMarker size={18} />
                    </div>
                    <div>
                      <h2 className="as-card-title">Location Coordinates</h2>
                      <p className="as-card-desc">
                        Geographic point for this slot (GeoJSON: longitude
                        first).
                      </p>
                    </div>
                  </div>

                  <div className="as-row-2">
                    <div className="as-field">
                      <label className="as-label">
                        Longitude
                        <span className="as-label-badge">−180 to 180</span>
                      </label>
                      <div className="as-coord-wrap">
                        <span className="as-coord-prefix">LNG</span>
                        <input
                          type="number"
                          step="any"
                          min="-180"
                          max="180"
                          className={`as-input as-input-coord ${errors.longitude ? "is-invalid" : ""}`}
                          placeholder="76.7352"
                          value={form.longitude}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              longitude: e.target.value,
                            }))
                          }
                          onBlur={() =>
                            setTouched((t) => ({ ...t, longitude: true }))
                          }
                        />
                      </div>
                      {errors.longitude && (
                        <p className="as-field-error">{errors.longitude}</p>
                      )}
                    </div>
                    <div className="as-field">
                      <label className="as-label">
                        Latitude
                        <span className="as-label-badge">−90 to 90</span>
                      </label>
                      <div className="as-coord-wrap">
                        <span className="as-coord-prefix">LAT</span>
                        <input
                          type="number"
                          step="any"
                          min="-90"
                          max="90"
                          className={`as-input as-input-coord ${errors.latitude ? "is-invalid" : ""}`}
                          placeholder="30.6947"
                          value={form.latitude}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, latitude: e.target.value }))
                          }
                          onBlur={() =>
                            setTouched((t) => ({ ...t, latitude: true }))
                          }
                        />
                      </div>
                      {errors.latitude && (
                        <p className="as-field-error">{errors.latitude}</p>
                      )}
                    </div>
                  </div>

                  {form.longitude &&
                    form.latitude &&
                    !errors.longitude &&
                    !errors.latitude && (
                      <div className="as-coord-preview">
                        <HiCheckCircle size={15} className="as-coord-check" />
                        <span className="as-coord-text">
                          {parseFloat(form.latitude).toFixed(4)}° N,{" "}
                          {parseFloat(form.longitude).toFixed(4)}° E
                        </span>
                      </div>
                    )}
                </div>

                {/* Actions */}
                <div className="as-actions">
                  <button
                    type="button"
                    className="as-btn-ghost"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="as-btn-primary"
                    disabled={!isFormValid || isSubmitting}
                  >
                    {isSubmitting && <Spinner />}
                    {isSubmitting ? "Creating…" : "Create Slot"}
                  </button>
                </div>
              </div>

              {/* ── RIGHT: Preview ── */}
              <div className="as-preview-col">
                <div className="as-sticky">
                  <div className="as-preview-card">
                    <p className="as-preview-label">Live Preview</p>
                    <div className="as-preview-body">
                      <div className="as-preview-row">
                        <div className="as-preview-row-icon">
                          <HiTag size={14} />
                        </div>
                        <div>
                          <p className="as-preview-meta">Category</p>
                          <p className="as-preview-value">
                            {selectedCategory?.name ?? (
                              <span className="as-preview-empty">
                                Not selected
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="as-preview-divider" />
                      <div className="as-preview-row">
                        <div className="as-preview-row-icon">
                          <HiCalendar size={14} />
                        </div>
                        <div>
                          <p className="as-preview-meta">Date</p>
                          <p className="as-preview-value">
                            {form.date ? (
                              new Date(
                                form.date + "T00:00:00",
                              ).toLocaleDateString("en-IN", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            ) : (
                              <span className="as-preview-empty">Not set</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="as-preview-divider" />
                      <div className="as-preview-row">
                        <div className="as-preview-row-icon">
                          <HiClock size={14} />
                        </div>
                        <div>
                          <p className="as-preview-meta">Time Window</p>
                          {form.startTime && form.endTime ? (
                            <p className="as-preview-value">
                              {form.startTime} – {form.endTime}
                            </p>
                          ) : (
                            <p className="as-preview-empty">Not set</p>
                          )}
                          {slotDuration > 0 && (
                            <span className="as-preview-badge">
                              {slotDuration} min
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="as-preview-divider" />
                      <div className="as-preview-row">
                        <div className="as-preview-row-icon">
                          <HiLocationMarker size={14} />
                        </div>
                        <div>
                          <p className="as-preview-meta">Coordinates</p>
                          {form.longitude && form.latitude ? (
                            <p className="as-preview-coords">
                              [{parseFloat(form.longitude).toFixed(4)},{" "}
                              {parseFloat(form.latitude).toFixed(4)}]
                            </p>
                          ) : (
                            <p className="as-preview-empty">Not set</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="as-payload-card">
                    <p className="as-preview-label">Request Payload</p>
                    <pre className="as-payload-pre">
                      {JSON.stringify(
                        {
                          category_id: form.category_id || "—",
                          date: form.date || "—",
                          startTime: form.startTime || "—",
                          endTime: form.endTime || "—",
                          location: {
                            coordinates: [
                              form.longitude ? parseFloat(form.longitude) : "—",
                              form.latitude ? parseFloat(form.latitude) : "—",
                            ],
                          },
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default AddSlot;
