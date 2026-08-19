import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useFetchVendorByIdQuery,
} from "../../../features/vendor/vendorApi";
import { useGetActiveCategoriesQuery } from "../../../features/category/categoryApi";
import { flattenForParentOptions } from "../../../features/category/categoryHelpers";
import type { FlatCategoryOption } from "../../../features/category/categoryTypes";
import "../../../styles/admin_vendor/AddVendor.css";
import { FullScreenLoader } from "../../../components/common/FullScreenLoader";

/* -------------------------------------------------------------------- */
/* Form state                                                            */
/* -------------------------------------------------------------------- */

interface VendorFormState {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  gst_number: string;
  vendorCategories: string[];
  serviceableAreas: string[];
}

const initialState: VendorFormState = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  gst_number: "",
  vendorCategories: [],
  serviceableAreas: [],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const GST_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PINCODE_RE = /^\d{6}$/;

const Spinner: React.FC = () => <span className="av-spinner" aria-hidden />;

/* -------------------------------------------------------------------- */
/* Category multi-select                                                 */
/* -------------------------------------------------------------------- */

interface CategoryMultiSelectProps {
  options: FlatCategoryOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
  errored?: boolean;
}

const CategoryMultiSelect: React.FC<CategoryMultiSelectProps> = ({
  options,
  value,
  onChange,
  loading,
  errored,
}) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const toggle = (id: string) => {
    if (selectedSet.has(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  const removeChip = (id: string) => onChange(value.filter((v) => v !== id));

  const selectedOptions = useMemo(
    () => options.filter((o) => selectedSet.has(o._id)),
    [options, selectedSet],
  );

  if (loading) return <div className="av-cat-status">Loading categories…</div>;
  if (errored)
    return (
      <div className="av-error">
        Couldn't load categories. Try refreshing the page.
      </div>
    );

  return (
    <div className={`av-cat-select ${errored ? "is-invalid" : ""}`}>
      {selectedOptions.length > 0 && (
        <div className="av-cat-chips">
          {selectedOptions.map((o) => (
            <span key={o._id} className="av-cat-chip">
              {o.name}
              <button
                type="button"
                className="av-cat-chip-remove"
                onClick={() => removeChip(o._id)}
                aria-label={`Remove ${o.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="av-cat-search">
        <span className="av-cat-search-icon" aria-hidden>
          ⌕
        </span>
        <input
          type="text"
          placeholder="Search categories…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <ul className="av-cat-list" role="listbox" aria-multiselectable>
        {filtered.map((opt) => {
          const checked = selectedSet.has(opt._id);
          return (
            <li
              key={opt._id}
              className={`av-cat-item ${checked ? "is-selected" : ""}`}
              style={{ paddingLeft: `${16 + opt.depth * 18}px` }}
              onClick={() => toggle(opt._id)}
              role="option"
              aria-selected={checked}
            >
              <span
                className={`av-cat-checkbox ${checked ? "is-checked" : ""}`}
              >
                {checked && "✓"}
              </span>
              {opt.depth > 0 && <span className="av-cat-branch">└ </span>}
              <span className="av-cat-item-label">{opt.name}</span>
              <span className="av-cat-item-level">L{opt.level}</span>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="av-cat-empty">No matching categories</li>
        )}
      </ul>
    </div>
  );
};

/* -------------------------------------------------------------------- */
/* Pincode input                                                         */
/* -------------------------------------------------------------------- */

interface PincodeInputProps {
  value: string[];
  onChange: (pincodes: string[]) => void;
  error?: string | null;
  setError: (e: string | null) => void;
}

const PincodeInput: React.FC<PincodeInputProps> = ({
  value,
  onChange,
  error,
  setError,
}) => {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const pin = draft.trim();
    if (!pin) return;
    if (!PINCODE_RE.test(pin)) {
      setError("Pincode must be exactly 6 digits.");
      return;
    }
    if (value.includes(pin)) {
      setError("That pincode is already added.");
      return;
    }
    setError(null);
    onChange([...value, pin]);
    setDraft("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    }
  };

  const removePin = (pin: string) => onChange(value.filter((p) => p !== pin));

  return (
    <div>
      <div className={`av-pincode-input-wrap ${error ? "is-invalid" : ""}`}>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          className="form-control av-input"
          placeholder="Enter a 6-digit pincode and press Enter"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value.replace(/\D/g, ""));
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className="av-pincode-add-btn" onClick={commit}>
          Add
        </button>
      </div>
      {error && <div className="av-error">{error}</div>}
      {value.length > 0 ? (
        <div className="av-pincode-chips">
          {value.map((pin) => (
            <span key={pin} className="av-pincode-chip">
              {pin}
              <button
                type="button"
                className="av-cat-chip-remove"
                onClick={() => removePin(pin)}
                aria-label={`Remove ${pin}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="av-hint">No serviceable areas added yet.</p>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------- */
/* Main component                                                        */
/* -------------------------------------------------------------------- */

const AddVendor: React.FC = () => {
  const navigate = useNavigate();
  const { vendorId } = useParams<{ vendorId?: string }>();

  // ── Edit mode flag ──────────────────────────────────────────────────
  const isEditMode = Boolean(vendorId);

  const [form, setForm] = useState<VendorFormState>(initialState);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [areasTouched, setAreasTouched] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);

  // ── Fetch existing vendor (edit mode only) ──────────────────────────
  const {
    data: vendorRes,
    isLoading: vendorLoading,
    isError: vendorError,
  } = useFetchVendorByIdQuery(vendorId!, { skip: !isEditMode });

  // ── Categories ──────────────────────────────────────────────────────
  const {
    data: categoriesRes,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useGetActiveCategoriesQuery();

  const [createVendor, { isLoading: isCreating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();

  const isSubmitting = isCreating || isUpdating;

  const categoryOptions: FlatCategoryOption[] = useMemo(
    () => flattenForParentOptions(categoriesRes?.data ?? []),
    [categoriesRes],
  );

  useEffect(() => {
    if (!vendorRes?.data) return;
    const v = vendorRes.data;

    setForm({
      fullName: v.fullName ?? "",
      email: v.email ?? "",
      password: "",
      phone: v.phone ?? "",
      address: v.address ?? "",
      gst_number: v.gst_number ?? "",
      vendorCategories:
        v.vendorCategories?.map((c: any) =>
          typeof c === "string" ? c : c._id,
        ) ?? [],
      serviceableAreas:
        v.serviceableAreas?.map((a: any) =>
          typeof a === "string" ? a : a.pincode,
        ) ?? [],
    });

    setTouched({
      fullName: true,
      email: true,
      phone: true,
      address: true,
      gst_number: true,
      // password intentionally left untouched — blank is OK in edit mode
    });
    setCategoryTouched(true);
    setAreasTouched(true);
  }, [vendorRes]);

  // ── Derived values ──────────────────────────────────────────────────
  const trimmed = {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    gst_number: form.gst_number.trim().toUpperCase(),
  };

  const errors = {
    fullName: !touched.fullName
      ? ""
      : !trimmed.fullName
        ? "Full name is required."
        : trimmed.fullName.length < 3
          ? "Name is too short (min 3 characters)."
          : "",
    email: !touched.email
      ? ""
      : !trimmed.email
        ? "Email is required."
        : !EMAIL_RE.test(trimmed.email)
          ? "Enter a valid email address."
          : "",
    // In edit mode password is optional; only validate if the user typed something
    password: !touched.password
      ? ""
      : isEditMode && !form.password
        ? ""
        : !form.password
          ? "Password is required."
          : form.password.length < 8
            ? "Password must be at least 8 characters."
            : "",
    phone: !touched.phone
      ? ""
      : !trimmed.phone
        ? "Phone number is required."
        : !PHONE_RE.test(trimmed.phone)
          ? "Enter a valid 10-digit Indian mobile number."
          : "",
    address: !touched.address
      ? ""
      : !trimmed.address
        ? "Address is required."
        : trimmed.address.length < 10
          ? "Add a more complete address (min 10 characters)."
          : "",
    gst_number: !touched.gst_number
      ? ""
      : !trimmed.gst_number
        ? "GST number is required."
        : !GST_RE.test(trimmed.gst_number)
          ? "Enter a valid 15-character GSTIN."
          : "",
    vendorCategories:
      categoryTouched && form.vendorCategories.length === 0
        ? "Select at least one service category."
        : "",
    serviceableAreas:
      areasTouched && form.serviceableAreas.length === 0
        ? "Add at least one serviceable pincode."
        : "",
  };

  const isFormValid =
    trimmed.fullName.length >= 3 &&
    EMAIL_RE.test(trimmed.email) &&
    // password required only in create mode (or if typed in edit mode)
    (isEditMode
      ? !form.password || form.password.length >= 8
      : form.password.length >= 8) &&
    PHONE_RE.test(trimmed.phone) &&
    trimmed.address.length >= 10 &&
    GST_RE.test(trimmed.gst_number) &&
    form.vendorCategories.length > 0 &&
    form.serviceableAreas.length > 0;

  const markAllTouched = () => {
    setTouched({
      fullName: true,
      email: true,
      password: true,
      phone: true,
      address: true,
      gst_number: true,
    });
    setCategoryTouched(true);
    setAreasTouched(true);
  };

  const handleReset = () => {
    setForm(initialState);
    setTouched({});
    setCategoryTouched(false);
    setAreasTouched(false);
    setPincodeError(null);
    navigate("/admin/vendors");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    markAllTouched();
    if (!isFormValid) return;

    const payload: any = {
      fullName: trimmed.fullName,
      email: trimmed.email,
      phone: trimmed.phone,
      address: trimmed.address,
      gst_number: trimmed.gst_number,
      vendorCategories: form.vendorCategories,
      serviceableAreas: form.serviceableAreas.map((pincode) => ({ pincode })),
    };

    // Only include password if provided
    if (form.password) payload.password = form.password;

    try {
      if (isEditMode) {
        await updateVendor({ userId: vendorId!, payload }).unwrap();
        toast.success("Vendor updated", {
          description: `"${trimmed.fullName}" has been updated successfully.`,
        });
      } else {
        await createVendor(payload).unwrap();
        toast.success("Vendor created", {
          description: `"${trimmed.fullName}" has been added successfully.`,
        });
      }
      navigate("/admin/vendors");
    } catch (err: any) {
      console.error("Vendor save failed:", err);
      const errMsg =
        err?.data?.message || "Something went wrong. Please try again.";
      toast.error(
        isEditMode ? "Failed to update vendor" : "Failed to create vendor",
        {
          description: errMsg,
        },
      );
    }
  };

  const selectedCategoryNames = categoryOptions
    .filter((o) => form.vendorCategories.includes(o._id))
    .map((o) => o.name);

  if (isEditMode && vendorLoading)
    return (
      <FullScreenLoader
        title="Loading Vendor"
        subtitle="Fetching vendor details..."
      />
    );

  if (isEditMode && vendorError) {
    return (
      <div className="av-page">
        <div className="container-fluid av-container">
          <div className="av-error-state">
            <p>Failed to load vendor details. Please try again.</p>
            <button
              className="btn av-btn-ghost"
              onClick={() => navigate("/admin/vendors")}
            >
              Back to vendors
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="av-page">
      <div className="container-fluid av-container">
        <div className="av-header">
          <div>
            <p className="av-eyebrow">Vendor Manager</p>
            <h1 className="av-title">
              {isEditMode ? "Edit Vendor" : "Add Vendor"}
            </h1>
            <p className="av-subtitle">
              {isEditMode
                ? "Update vendor details, categories, and coverage."
                : "Onboard a new service vendor with categories, coverage, and verification details."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} onReset={handleReset} noValidate>
          <fieldset className="av-fieldset" disabled={isSubmitting}>
            <div className="row g-4 av-body">
              {/* LEFT: form */}
              <div className="col-12 col-lg-8">
                {/* 01: Account */}
                <section className="av-card">
                  <header className="av-card-header">
                    <span className="av-card-index">01</span>
                    <div>
                      <h2>Account details</h2>
                      <p>Vendor's login identity and contact number.</p>
                    </div>
                  </header>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="av-field">
                        <label htmlFor="av-fullName">Full name</label>
                        <input
                          id="av-fullName"
                          type="text"
                          className={`form-control av-input ${errors.fullName ? "is-invalid" : ""}`}
                          placeholder="e.g. Aditya Sharma"
                          value={form.fullName}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, fullName: e.target.value }))
                          }
                          onBlur={() =>
                            setTouched((t) => ({ ...t, fullName: true }))
                          }
                        />
                        {errors.fullName && (
                          <div className="av-error">{errors.fullName}</div>
                        )}
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="av-field">
                        <label htmlFor="av-phone">Phone number</label>
                        <input
                          id="av-phone"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          className={`form-control av-input ${errors.phone ? "is-invalid" : ""}`}
                          placeholder="9876543210"
                          value={form.phone}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              phone: e.target.value.replace(/\D/g, ""),
                            }))
                          }
                          onBlur={() =>
                            setTouched((t) => ({ ...t, phone: true }))
                          }
                        />
                        {errors.phone && (
                          <div className="av-error">{errors.phone}</div>
                        )}
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="av-field">
                        <label htmlFor="av-email">Email address</label>
                        <input
                          id="av-email"
                          type="email"
                          className={`form-control av-input ${errors.email ? "is-invalid" : ""}`}
                          placeholder="vendor@example.com"
                          value={form.email}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, email: e.target.value }))
                          }
                          onBlur={() =>
                            setTouched((t) => ({ ...t, email: true }))
                          }
                        />
                        {errors.email && (
                          <div className="av-error">{errors.email}</div>
                        )}
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="av-field">
                        <label htmlFor="av-password">
                          {isEditMode ? "New password" : "Temporary password"}
                          {isEditMode && (
                            <span className="av-hint-inline">
                              {" "}
                              (leave blank to keep current)
                            </span>
                          )}
                        </label>
                        <div className="av-password-wrap">
                          <input
                            ref={passwordRef}
                            id="av-password"
                            type={showPassword ? "text" : "password"}
                            className={`form-control av-input ${errors.password ? "is-invalid" : ""}`}
                            placeholder={
                              isEditMode
                                ? "Leave blank to keep current"
                                : "Min. 8 characters"
                            }
                            value={form.password}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                password: e.target.value,
                              }))
                            }
                            onBlur={() =>
                              setTouched((t) => ({ ...t, password: true }))
                            }
                          />
                          <button
                            type="button"
                            className="av-password-toggle"
                            onClick={() => setShowPassword((s) => !s)}
                            tabIndex={-1}
                          >
                            {showPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                        {errors.password ? (
                          <div className="av-error">{errors.password}</div>
                        ) : (
                          <span className="av-hint">
                            {isEditMode
                              ? "Only fill this to change the vendor's password."
                              : "Vendor can change this after first login."}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 02: Business */}
                <section className="av-card">
                  <header className="av-card-header">
                    <span className="av-card-index">02</span>
                    <div>
                      <h2>Business details</h2>
                      <p>Registered address and GST identification.</p>
                    </div>
                  </header>

                  <div className="av-field">
                    <label htmlFor="av-address">Address</label>
                    <textarea
                      id="av-address"
                      className={`form-control av-input av-textarea ${errors.address ? "is-invalid" : ""}`}
                      placeholder="Plot 45, Industrial Area Phase 2, Chandigarh"
                      rows={3}
                      value={form.address}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, address: e.target.value }))
                      }
                      onBlur={() =>
                        setTouched((t) => ({ ...t, address: true }))
                      }
                    />
                    {errors.address && (
                      <div className="av-error">{errors.address}</div>
                    )}
                  </div>

                  <div className="av-field">
                    <label htmlFor="av-gst">GST number</label>
                    <input
                      id="av-gst"
                      type="text"
                      maxLength={15}
                      className={`form-control av-input av-mono ${errors.gst_number ? "is-invalid" : ""}`}
                      placeholder="03ABCDE1234F1Z5"
                      value={form.gst_number}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          gst_number: e.target.value.toUpperCase(),
                        }))
                      }
                      onBlur={() =>
                        setTouched((t) => ({ ...t, gst_number: true }))
                      }
                    />
                    {errors.gst_number ? (
                      <div className="av-error">{errors.gst_number}</div>
                    ) : (
                      <span className="av-hint">
                        15-character GSTIN, used for invoicing and verification.
                      </span>
                    )}
                  </div>
                </section>

                {/* 03: Categories */}
                <section className="av-card">
                  <header className="av-card-header">
                    <span className="av-card-index">03</span>
                    <div>
                      <h2>Service categories</h2>
                      <p>Select every category this vendor is qualified for.</p>
                    </div>
                  </header>
                  <CategoryMultiSelect
                    options={categoryOptions}
                    value={form.vendorCategories}
                    onChange={(ids) => {
                      setForm((p) => ({ ...p, vendorCategories: ids }));
                      setCategoryTouched(true);
                    }}
                    loading={categoriesLoading}
                    errored={categoriesError}
                  />
                  {errors.vendorCategories && (
                    <div className="av-error">{errors.vendorCategories}</div>
                  )}
                </section>

                {/* 04: Serviceable areas */}
                <section className="av-card">
                  <header className="av-card-header">
                    <span className="av-card-index">04</span>
                    <div>
                      <h2>Serviceable areas</h2>
                      <p>Pincodes where this vendor can accept bookings.</p>
                    </div>
                  </header>
                  <PincodeInput
                    value={form.serviceableAreas}
                    onChange={(pincodes) => {
                      setForm((p) => ({ ...p, serviceableAreas: pincodes }));
                      setAreasTouched(true);
                    }}
                    error={pincodeError}
                    setError={setPincodeError}
                  />
                  {errors.serviceableAreas && (
                    <div className="av-error">{errors.serviceableAreas}</div>
                  )}
                </section>

                {/* Actions */}
                <div className="av-actions">
                  <button type="reset" className="btn av-btn-ghost">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn av-btn-primary"
                    disabled={!isFormValid || isSubmitting}
                  >
                    {isSubmitting && <Spinner />}
                    {isSubmitting
                      ? isEditMode
                        ? "Saving…"
                        : "Creating…"
                      : isEditMode
                        ? "Save changes"
                        : "Create vendor"}
                  </button>
                </div>
              </div>

              {/* RIGHT: live preview */}
              <div className="col-12 col-lg-4">
                <div className="av-sticky">
                  <div className="av-preview-card">
                    <p className="av-preview-label">Live preview</p>
                    <div className="av-tile">
                      <div className="av-tile-avatar">
                        {trimmed.fullName
                          ? trimmed.fullName.charAt(0).toUpperCase()
                          : "V"}
                      </div>
                      <div className="av-tile-body">
                        <p className="av-tile-name">
                          {trimmed.fullName || "Vendor full name"}
                        </p>
                        <p className="av-tile-sub">
                          {trimmed.email || "vendor@example.com"}
                        </p>
                        <p className="av-tile-sub">
                          {trimmed.phone || "Phone number"}
                        </p>
                        <div className="av-tile-tags">
                          {selectedCategoryNames.length > 0 ? (
                            selectedCategoryNames.map((name) => (
                              <span className="av-tag" key={name}>
                                {name}
                              </span>
                            ))
                          ) : (
                            <span className="av-tag av-tag--muted">
                              No categories yet
                            </span>
                          )}
                        </div>
                        <div className="av-stat-group">
                          <p className="av-stat-group-label">Coverage</p>
                          <div className="av-stat-grid">
                            <div className="av-stat">
                              <span className="av-stat-value">
                                {form.serviceableAreas.length}
                              </span>
                              <span className="av-stat-label">Pincodes</span>
                            </div>
                            <div className="av-stat">
                              <span className="av-stat-value">
                                {form.vendorCategories.length}
                              </span>
                              <span className="av-stat-label">Categories</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="av-gst-card">
                    <p className="av-preview-label">GSTIN</p>
                    <p className="av-gst-value">
                      {trimmed.gst_number || "— — — — — — — — —"}
                    </p>
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

export default AddVendor;
