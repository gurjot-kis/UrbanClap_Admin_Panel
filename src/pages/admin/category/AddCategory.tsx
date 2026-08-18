import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetActiveCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "../../../features/category/categoryApi";
import {
  flattenForParentOptions,
  getAncestorChain,
} from "../../../features/category/categoryHelpers";
import type { FlatCategoryOption } from "../../../features/category/categoryTypes";
import "../../../styles/category/AddCategory.css";
import { FullScreenLoader } from "../../../components/common/FullScreenLoader";

export interface NestedSlotConfig {
  allowInstant: boolean;
  allowSchedule: boolean;
  instant: {
    duration: number;
    bufferTime: number;
    searchRadiusKm: number;
  };
  schedule: {
    slotIntervalMinutes: number;
    workingHours: {
      start: string;
      end: string;
    };
    minAdvanceBookingHours: number;
    maxAdvanceBookingDays: number;
  };
}

export interface ExtendedFormState {
  name: string;
  parent_id: string;
  description: string;
  category_image: File | null;
  slotConfig: NestedSlotConfig;
}

const defaultSlotConfig: NestedSlotConfig = {
  allowInstant: false,
  allowSchedule: true,
  instant: {
    duration: 60,
    bufferTime: 30,
    searchRadiusKm: 10,
  },
  schedule: {
    slotIntervalMinutes: 30,
    workingHours: { start: "09:00", end: "21:00" },
    minAdvanceBookingHours: 2,
    maxAdvanceBookingDays: 15,
  },
};

const initialState: ExtendedFormState = {
  name: "",
  parent_id: "",
  description: "",
  category_image: null,
  slotConfig: defaultSlotConfig,
};

const MAX_IMAGE_MB = 4;

/* -------------------------------------------------------------------- */
/* Custom Parent-Category Combobox Select                               */
/* -------------------------------------------------------------------- */
interface ParentCategorySelectProps {
  options: FlatCategoryOption[];
  value: string;
  onChange: (id: string) => void;
  loading?: boolean;
  errored?: boolean;
  disabledOptionId?: string;
}

const ParentCategorySelect: React.FC<ParentCategorySelectProps> = ({
  options,
  value,
  onChange,
  loading,
  errored,
  disabledOptionId,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o._id === value) ?? null;

  const filtered = useMemo(() => {
    let opts = options;
    if (disabledOptionId) {
      opts = opts.filter((o) => o._id !== disabledOptionId);
    }
    if (!query.trim()) return opts;
    const q = query.trim().toLowerCase();
    return opts.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query, disabledOptionId]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  const disabled = loading || errored;

  return (
    <div className={`cc-select ${open ? "is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className={`cc-select-trigger ${errored ? "is-invalid" : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`cc-select-value ${!selected ? "is-placeholder" : ""}`}
        >
          {loading ? (
            "Loading categories…"
          ) : selected ? (
            <>
              {selected.depth > 0 && (
                <span className="cc-select-branch">└ </span>
              )}
              {selected.name}
              <span className="cc-select-level-chip">L{selected.level}</span>
            </>
          ) : (
            "No parent (top-level, Level 1)"
          )}
        </span>
        <span
          className={`cc-select-chevron ${open ? "is-open" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && !disabled && (
        <div className="cc-select-panel">
          <div className="cc-select-search">
            <span className="cc-select-search-icon" aria-hidden>
              ⌕
            </span>
            <input
              autoFocus
              type="text"
              placeholder="Search categories…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ul className="cc-select-list" role="listbox">
            <li
              className={`cc-select-option ${!value ? "is-selected" : ""}`}
              onClick={() => handleSelect("")}
              role="option"
              aria-selected={!value}
            >
              <span className="cc-select-option-label">
                — No parent (top-level, Level 1) —
              </span>
              {!value && <span className="cc-select-check">✓</span>}
            </li>

            {filtered.map((opt) => (
              <li
                key={opt._id}
                className={`cc-select-option ${value === opt._id ? "is-selected" : ""}`}
                style={{ paddingLeft: `${16 + opt.depth * 18}px` }}
                onClick={() => handleSelect(opt._id)}
                role="option"
                aria-selected={value === opt._id}
              >
                {opt.depth > 0 && <span className="cc-select-branch">└ </span>}
                <span className="cc-select-option-label">{opt.name}</span>
                <span className="cc-select-option-level">L{opt.level}</span>
                {value === opt._id && (
                  <span className="cc-select-check">✓</span>
                )}
              </li>
            ))}

            {filtered.length === 0 && (
              <li className="cc-select-empty">No matching categories</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const Spinner: React.FC = () => <span className="cc-spinner" aria-hidden />;

const CategoryForm: React.FC = () => {
  const { categoryId, id } = useParams<{ categoryId?: string; id?: string }>();
  const currentCategoryId = categoryId || id;
  const isEditMode = Boolean(currentCategoryId);

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ExtendedFormState>(initialState);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isImageRemoved, setIsImageRemoved] = useState(false);

  // RTK Queries & Mutations
  const {
    data: categoriesRes,
    isLoading: parentsLoading,
    isError: parentsError,
  } = useGetActiveCategoriesQuery();

  const { data: categoryDetailsRes, isLoading: isCategoryLoading } =
    useGetCategoryByIdQuery(currentCategoryId as string, {
      skip: !isEditMode,
    });

  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation();

  const isSubmitting = isCreating || isUpdating;

  // Populate data in edit mode
  useEffect(() => {
    if (isEditMode && categoryDetailsRes) {
      const responseData = (categoryDetailsRes as any)?.data;
      if (responseData) {
        setIsImageRemoved(false);
        setForm({
          name: responseData.name || "",
          parent_id: responseData.parent_id || "",
          description: responseData.description || "",
          category_image: null,
          slotConfig: {
            allowInstant:
              responseData.slotConfig?.allowInstant ??
              defaultSlotConfig.allowInstant,
            allowSchedule:
              responseData.slotConfig?.allowSchedule ??
              defaultSlotConfig.allowSchedule,
            instant: {
              duration:
                responseData.slotConfig?.instant?.duration ??
                defaultSlotConfig.instant.duration,
              bufferTime:
                responseData.slotConfig?.instant?.bufferTime ??
                defaultSlotConfig.instant.bufferTime,
              searchRadiusKm:
                responseData.slotConfig?.instant?.searchRadiusKm ??
                defaultSlotConfig.instant.searchRadiusKm,
            },
            schedule: {
              slotIntervalMinutes:
                responseData.slotConfig?.schedule?.slotIntervalMinutes ??
                defaultSlotConfig.schedule.slotIntervalMinutes,
              workingHours: {
                start:
                  responseData.slotConfig?.schedule?.workingHours?.start ??
                  defaultSlotConfig.schedule.workingHours.start,
                end:
                  responseData.slotConfig?.schedule?.workingHours?.end ??
                  defaultSlotConfig.schedule.workingHours.end,
              },
              minAdvanceBookingHours:
                responseData.slotConfig?.schedule?.minAdvanceBookingHours ??
                defaultSlotConfig.schedule.minAdvanceBookingHours,
              maxAdvanceBookingDays:
                responseData.slotConfig?.schedule?.maxAdvanceBookingDays ??
                defaultSlotConfig.schedule.maxAdvanceBookingDays,
            },
          },
        });

        if (responseData.category_image) {
          setImagePreview(
            import.meta.env.VITE_API_ASSET_URL + responseData.category_image,
          );
        }
      }
    }
  }, [isEditMode, categoryDetailsRes]);

  const categoryTree = categoriesRes?.data;

  const parentOptions: FlatCategoryOption[] = useMemo(
    () => flattenForParentOptions(categoryTree ?? []),
    [categoryTree],
  );

  const selectedParent = useMemo(
    () => parentOptions.find((p) => p._id === form.parent_id) ?? null,
    [parentOptions, form.parent_id],
  );

  const ancestorChain = useMemo(
    () =>
      form.parent_id ? getAncestorChain(categoryTree, form.parent_id) : [],
    [categoryTree, form.parent_id],
  );

  const resolvedLevel = selectedParent ? selectedParent.level + 1 : 1;
  const trimmedName = form.name.trim();
  const trimmedDesc = form.description.trim();

  const errors = {
    name: !touched.name
      ? ""
      : !trimmedName
        ? "Category name is required."
        : trimmedName.length < 2
          ? "Category name is too short (min 2 characters)."
          : "",
    description: !touched.description
      ? ""
      : !trimmedDesc
        ? "Description is required."
        : trimmedDesc.length < 10
          ? "Add a little more detail (min 10 characters)."
          : "",
    image: imageError,
  };

  const isFormValid =
    form.name.trim().length >= 2 &&
    form.description.trim().length >= 10 &&
    !imageError;

  const handleFile = (file: File | undefined | null) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Only image files are supported (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setImageError(`Image must be smaller than ${MAX_IMAGE_MB}MB.`);
      return;
    }

    setImageError(null);
    setIsImageRemoved(false);
    setForm((prev) => ({ ...prev, category_image: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, category_image: null }));
    setImagePreview(null);
    setImageError(null);
    setIsImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const buildFormData = (): FormData => {
    const fd = new FormData();
    fd.append("name", form.name.trim());
    if (form.parent_id) fd.append("parent_id", form.parent_id);
    fd.append("description", form.description.trim());
    if (form.category_image) {
      fd.append("category_image", form.category_image);
    } else if (isEditMode && isImageRemoved) {
      fd.append("remove_image", "true");
    }
    fd.append("slotConfig", JSON.stringify(form.slotConfig));
    return fd;
  };

  const handleCancelOrReset = () => {
    navigate("/admin/categories");
    setForm(initialState);
    setIsImageRemoved(false);
    removeImage();
    setTouched({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, description: true });
    if (!isFormValid) return;

    const categoryName = form.name.trim();

    try {
      if (isEditMode && currentCategoryId) {
        await updateCategory({
          categoryId: currentCategoryId,
          formData: buildFormData(),
        }).unwrap();
        toast.success("Category updated", {
          description: `"${categoryName}" has been updated successfully.`,
        });
      } else {
        await createCategory(buildFormData()).unwrap();
        toast.success("Category created", {
          description: `"${categoryName}" has been created successfully.`,
        });
      }
      navigate("/admin/categories");
    } catch (err: any) {
      console.error("Operation failed:", err);
      const errMsg =
        err?.data?.message || "Something went wrong. Please try again.";
      toast.error(`Failed to ${isEditMode ? "update" : "create"} category`, {
        description: errMsg,
      });
    }
  };

  if (isEditMode && isCategoryLoading) {
    return (
      <FullScreenLoader
        title="Loading Category"
        subtitle="Retrieving details, slots, and subcategories..."
      />
    );
  }

  return (
    <div className="cc-page">
      <div className="container-fluid cc-container">
        {/* Header */}
        <div className="cc-header">
          <div>
            <p className="cc-eyebrow">Category Manager</p>
            <h1 className="cc-title">
              {isEditMode ? "Edit Category" : "Add Category"}
            </h1>
            <p className="cc-subtitle">
              {isEditMode
                ? "Update service category details and booking dispatch rules."
                : "Create a service category and configure booking availability rules."}
            </p>
          </div>
          <div className="cc-level-pill" data-level={resolvedLevel}>
            <span className="cc-level-dot" />
            Level {resolvedLevel}
          </div>
        </div>

        <form onSubmit={handleSubmit} onReset={handleCancelOrReset} noValidate>
          <fieldset className="cc-fieldset" disabled={isSubmitting}>
            <div className="row g-4 cc-body">
              {/* LEFT: form */}
              <div className="col-12 col-lg-8">
                {/* Section 01: Details */}
                <section className="cc-card">
                  <header className="cc-card-header">
                    <span className="cc-card-index">01</span>
                    <div>
                      <h2>Category details</h2>
                      <p>The name and description shown to customers.</p>
                    </div>
                  </header>

                  <div className="cc-field">
                    <label htmlFor="cc-name">Category name</label>
                    <input
                      id="cc-name"
                      type="text"
                      className={`form-control cc-input ${errors.name ? "is-invalid" : ""}`}
                      placeholder="e.g. Sofa Cleaning"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    />
                    {errors.name && (
                      <div className="cc-error">{errors.name}</div>
                    )}
                  </div>

                  <div className="cc-field">
                    <label htmlFor="cc-description">Description</label>
                    <textarea
                      id="cc-description"
                      className={`form-control cc-input cc-textarea ${errors.description ? "is-invalid" : ""}`}
                      placeholder="Describe what this category covers…"
                      rows={4}
                      value={form.description}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, description: e.target.value }))
                      }
                      onBlur={() =>
                        setTouched((t) => ({ ...t, description: true }))
                      }
                    />
                    <div className="cc-field-footer">
                      {errors.description ? (
                        <span className="cc-error">{errors.description}</span>
                      ) : (
                        <span className="cc-hint">
                          Shown on the category card and search results.
                        </span>
                      )}
                      <span className="cc-count">
                        {form.description.length}/300
                      </span>
                    </div>
                  </div>
                </section>

                {/* Section 02: Hierarchy */}
                <section className="cc-card">
                  <header className="cc-card-header">
                    <span className="cc-card-index">02</span>
                    <div>
                      <h2>Hierarchy</h2>
                      <p>
                        Pick a parent to nest this category, or leave blank for
                        a top-level category.
                      </p>
                    </div>
                  </header>

                  <div className="cc-field">
                    <label htmlFor="cc-parent">Parent category</label>
                    <ParentCategorySelect
                      options={parentOptions}
                      value={form.parent_id}
                      onChange={(id) =>
                        setForm((p) => ({ ...p, parent_id: id }))
                      }
                      loading={parentsLoading}
                      errored={parentsError}
                      disabledOptionId={currentCategoryId}
                    />

                    {parentsError && (
                      <div className="cc-error">
                        Couldn't load categories. Parent selection is
                        unavailable right now.
                      </div>
                    )}
                    {!parentsLoading && !parentsError && (
                      <div className="cc-hint">
                        This category will be structured as{" "}
                        <strong>Level {resolvedLevel}</strong>
                        {selectedParent ? (
                          <> under “{selectedParent.name}”</>
                        ) : null}
                        .
                      </div>
                    )}
                  </div>
                </section>

                {/* Section 03: Media */}
                <section className="cc-card">
                  <header className="cc-card-header">
                    <span className="cc-card-index">03</span>
                    <div>
                      <h2>Category image</h2>
                      <p>Used as the tile thumbnail across the app.</p>
                    </div>
                  </header>

                  <div
                    className={`cc-dropzone ${isDragging ? "is-dragging" : ""} ${errors.image ? "is-invalid" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleFile(e.dataTransfer.files?.[0]);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                  >
                    {imagePreview ? (
                      <div className="cc-preview-wrap">
                        <img
                          src={imagePreview}
                          alt="Category preview"
                          className="cc-dropzone-image"
                        />
                        <button
                          type="button"
                          className="cc-remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage();
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="cc-dropzone-empty">
                        <div className="cc-dropzone-icon">⤒</div>
                        <p className="cc-dropzone-title">
                          Drag &amp; drop an image, or click to browse
                        </p>
                        <p className="cc-dropzone-hint">
                          PNG, JPG or WEBP · up to {MAX_IMAGE_MB}MB
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                  </div>
                  {errors.image && (
                    <div className="cc-error">{errors.image}</div>
                  )}
                </section>

                {/* Section 04: Booking & Slot Configuration */}
                <section className="cc-card">
                  <header className="cc-card-header">
                    <span className="cc-card-index">04</span>
                    <div>
                      <h2>Booking &amp; dispatch rules</h2>
                      <p>
                        Configure operational buffers, search radii, and working
                        hours.
                      </p>
                    </div>
                  </header>

                  {/* Instant Booking */}
                  <div
                    className={`cc-rule-card cc-rule-card--instant ${form.slotConfig.allowInstant ? "is-active" : ""}`}
                  >
                    <div className="cc-rule-head">
                      <span className="cc-rule-icon" aria-hidden>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"
                            fill="currentColor"
                          />
                        </svg>
                      </span>
                      <div className="cc-rule-copy">
                        <p className="cc-rule-title">Instant booking</p>
                        <p className="cc-rule-hint">
                          On-demand booking, matched to nearby active providers
                          in real time.
                        </p>
                      </div>
                      <label className="cc-switch-premium">
                        <input
                          type="checkbox"
                          checked={form.slotConfig.allowInstant}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              slotConfig: {
                                ...p.slotConfig,
                                allowInstant: e.target.checked,
                              },
                            }))
                          }
                        />
                        <span className="cc-switch-premium-track">
                          <span className="cc-switch-premium-thumb" />
                        </span>
                      </label>
                    </div>

                    {form.slotConfig.allowInstant && (
                      <div className="cc-rule-body">
                        <div className="row g-3">
                          <div className="col-12 col-md-4">
                            <label className="cc-rule-field-label">
                              Service duration
                            </label>
                            <div className="cc-input-unit-wrap">
                              <input
                                type="number"
                                min="1"
                                className="form-control cc-input"
                                value={form.slotConfig.instant.duration}
                                onChange={(e) =>
                                  setForm((p) => ({
                                    ...p,
                                    slotConfig: {
                                      ...p.slotConfig,
                                      instant: {
                                        ...p.slotConfig.instant,
                                        duration: Math.max(
                                          1,
                                          Number(e.target.value),
                                        ),
                                      },
                                    },
                                  }))
                                }
                              />
                              <span className="cc-input-unit">mins</span>
                            </div>
                          </div>

                          <div className="col-12 col-md-4">
                            <label className="cc-rule-field-label">
                              Buffer time
                            </label>
                            <div className="cc-input-unit-wrap">
                              <input
                                type="number"
                                min="0"
                                className="form-control cc-input"
                                value={form.slotConfig.instant.bufferTime}
                                onChange={(e) =>
                                  setForm((p) => ({
                                    ...p,
                                    slotConfig: {
                                      ...p.slotConfig,
                                      instant: {
                                        ...p.slotConfig.instant,
                                        bufferTime: Math.max(
                                          0,
                                          Number(e.target.value),
                                        ),
                                      },
                                    },
                                  }))
                                }
                              />
                              <span className="cc-input-unit">mins</span>
                            </div>
                          </div>

                          <div className="col-12 col-md-4">
                            <label className="cc-rule-field-label">
                              Search radius
                            </label>
                            <div className="cc-input-unit-wrap">
                              <input
                                type="number"
                                min="1"
                                className="form-control cc-input"
                                value={form.slotConfig.instant.searchRadiusKm}
                                onChange={(e) =>
                                  setForm((p) => ({
                                    ...p,
                                    slotConfig: {
                                      ...p.slotConfig,
                                      instant: {
                                        ...p.slotConfig.instant,
                                        searchRadiusKm: Math.max(
                                          1,
                                          Number(e.target.value),
                                        ),
                                      },
                                    },
                                  }))
                                }
                              />
                              <span className="cc-input-unit">km</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scheduled Booking */}
                  <div
                    className={`cc-rule-card cc-rule-card--schedule ${form.slotConfig.allowSchedule ? "is-active" : ""}`}
                  >
                    <div className="cc-rule-head">
                      <span className="cc-rule-icon" aria-hidden>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <rect
                            x="3"
                            y="5"
                            width="18"
                            height="16"
                            rx="3"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path
                            d="M3 10h18M8 3v4M16 3v4"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <div className="cc-rule-copy">
                        <p className="cc-rule-title">Scheduled booking</p>
                        <p className="cc-rule-hint">
                          Advance calendar slots based on working windows.
                        </p>
                      </div>
                      <label className="cc-switch-premium">
                        <input
                          type="checkbox"
                          checked={form.slotConfig.allowSchedule}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              slotConfig: {
                                ...p.slotConfig,
                                allowSchedule: e.target.checked,
                              },
                            }))
                          }
                        />
                        <span className="cc-switch-premium-track">
                          <span className="cc-switch-premium-thumb" />
                        </span>
                      </label>
                    </div>

                    {form.slotConfig.allowSchedule && (
                      <div className="cc-rule-body">
                        <div className="row g-3">
                          <div className="col-12 col-md-6">
                            <label className="cc-rule-field-label">
                              Working start time
                            </label>
                            <input
                              type="time"
                              className="form-control cc-input"
                              style={{ cursor: "pointer" }}
                              value={
                                form.slotConfig.schedule.workingHours.start
                              }
                              onClick={(e) => e.currentTarget.showPicker?.()}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  slotConfig: {
                                    ...p.slotConfig,
                                    schedule: {
                                      ...p.slotConfig.schedule,
                                      workingHours: {
                                        ...p.slotConfig.schedule.workingHours,
                                        start: e.target.value,
                                      },
                                    },
                                  },
                                }))
                              }
                            />
                          </div>

                          <div className="col-12 col-md-6">
                            <label className="cc-rule-field-label">
                              Working end time
                            </label>
                            <input
                              type="time"
                              className="form-control cc-input"
                              style={{ cursor: "pointer" }}
                              value={form.slotConfig.schedule.workingHours.end}
                              onClick={(e) => e.currentTarget.showPicker?.()}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  slotConfig: {
                                    ...p.slotConfig,
                                    schedule: {
                                      ...p.slotConfig.schedule,
                                      workingHours: {
                                        ...p.slotConfig.schedule.workingHours,
                                        end: e.target.value,
                                      },
                                    },
                                  },
                                }))
                              }
                            />
                          </div>

                          <div className="col-12 col-md-4">
                            <label className="cc-rule-field-label">
                              Slot interval
                            </label>
                            <div className="cc-input-unit-wrap">
                              <input
                                type="number"
                                min="5"
                                step="5"
                                className="form-control cc-input"
                                value={
                                  form.slotConfig.schedule.slotIntervalMinutes
                                }
                                onChange={(e) =>
                                  setForm((p) => ({
                                    ...p,
                                    slotConfig: {
                                      ...p.slotConfig,
                                      schedule: {
                                        ...p.slotConfig.schedule,
                                        slotIntervalMinutes: Math.max(
                                          1,
                                          Number(e.target.value),
                                        ),
                                      },
                                    },
                                  }))
                                }
                              />
                              <span className="cc-input-unit">mins</span>
                            </div>
                          </div>

                          <div className="col-12 col-md-4">
                            <label className="cc-rule-field-label">
                              Min lead time
                            </label>
                            <div className="cc-input-unit-wrap">
                              <input
                                type="number"
                                min="0"
                                className="form-control cc-input"
                                value={
                                  form.slotConfig.schedule
                                    .minAdvanceBookingHours
                                }
                                onChange={(e) =>
                                  setForm((p) => ({
                                    ...p,
                                    slotConfig: {
                                      ...p.slotConfig,
                                      schedule: {
                                        ...p.slotConfig.schedule,
                                        minAdvanceBookingHours: Math.max(
                                          0,
                                          Number(e.target.value),
                                        ),
                                      },
                                    },
                                  }))
                                }
                              />
                              <span className="cc-input-unit">hrs</span>
                            </div>
                          </div>

                          <div className="col-12 col-md-4">
                            <label className="cc-rule-field-label">
                              Max bookable
                            </label>
                            <div className="cc-input-unit-wrap">
                              <input
                                type="number"
                                min="1"
                                className="form-control cc-input"
                                value={
                                  form.slotConfig.schedule.maxAdvanceBookingDays
                                }
                                onChange={(e) =>
                                  setForm((p) => ({
                                    ...p,
                                    slotConfig: {
                                      ...p.slotConfig,
                                      schedule: {
                                        ...p.slotConfig.schedule,
                                        maxAdvanceBookingDays: Math.max(
                                          1,
                                          Number(e.target.value),
                                        ),
                                      },
                                    },
                                  }))
                                }
                              />
                              <span className="cc-input-unit">days</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Actions */}
                <div className="cc-actions">
                  <button type="reset" className="btn cc-btn-ghost">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn cc-btn-primary"
                    disabled={!isFormValid || isSubmitting}
                  >
                    {isSubmitting && <Spinner />}
                    {isSubmitting
                      ? isEditMode
                        ? "Updating…"
                        : "Creating…"
                      : isEditMode
                        ? "Update category"
                        : "Create category"}
                  </button>
                </div>
              </div>

              {/* RIGHT: live preview */}
              <div className="col-12 col-lg-4">
                <div className="cc-sticky">
                  <div className="cc-preview-card">
                    <p className="cc-preview-label">Live preview</p>
                    <div className="cc-tile">
                      <div className="cc-tile-image">
                        {imagePreview ? (
                          <img src={imagePreview} alt="" />
                        ) : (
                          <span className="cc-tile-placeholder">
                            No image yet
                          </span>
                        )}
                      </div>
                      <div className="cc-tile-body">
                        <p className="cc-tile-name">
                          {form.name || "Category name"}
                        </p>
                        <p className="cc-tile-desc">
                          {form.description ||
                            "Category description will appear here as you type."}
                        </p>
                        <div className="cc-tile-tags">
                          {form.slotConfig.allowInstant && (
                            <span className="cc-tag">
                              Instant ({form.slotConfig.instant.duration}m)
                            </span>
                          )}
                          {form.slotConfig.allowSchedule && (
                            <span className="cc-tag">
                              Scheduled (
                              {form.slotConfig.schedule.workingHours.start} -{" "}
                              {form.slotConfig.schedule.workingHours.end})
                            </span>
                          )}
                        </div>

                        {/* Live rules summary breakdown */}
                        <div className="cc-tile-specs">
                          {form.slotConfig.allowInstant && (
                            <div className="cc-stat-group">
                              <p className="cc-stat-group-label">Instant</p>
                              <div className="cc-stat-grid">
                                <div className="cc-stat">
                                  <span className="cc-stat-value">
                                    {form.slotConfig.instant.searchRadiusKm}
                                    <small>km</small>
                                  </span>
                                  <span className="cc-stat-label">Radius</span>
                                </div>
                                <div className="cc-stat">
                                  <span className="cc-stat-value">
                                    {form.slotConfig.instant.bufferTime}
                                    <small>m</small>
                                  </span>
                                  <span className="cc-stat-label">Buffer</span>
                                </div>
                              </div>
                            </div>
                          )}
                          {form.slotConfig.allowSchedule && (
                            <div className="cc-stat-group">
                              <p className="cc-stat-group-label">Scheduled</p>
                              <div className="cc-stat-grid">
                                <div className="cc-stat">
                                  <span className="cc-stat-value">
                                    {
                                      form.slotConfig.schedule
                                        .minAdvanceBookingHours
                                    }
                                    <small>h</small>
                                  </span>
                                  <span className="cc-stat-label">
                                    Lead time
                                  </span>
                                </div>
                                <div className="cc-stat">
                                  <span className="cc-stat-value">
                                    {
                                      form.slotConfig.schedule
                                        .maxAdvanceBookingDays
                                    }
                                    <small>d</small>
                                  </span>
                                  <span className="cc-stat-label">
                                    Max horizon
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="cc-trail-card">
                    <p className="cc-preview-label">Hierarchy trail</p>
                    <ol className="cc-trail">
                      {[
                        ...ancestorChain.map((c) => c.name),
                        form.name || "This category",
                      ].map((label, i, arr) => (
                        <li
                          key={i}
                          className={
                            i === arr.length - 1 ? "is-current" : "is-done"
                          }
                        >
                          Level {i + 1} — {label}
                        </li>
                      ))}
                    </ol>
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

export default CategoryForm;
