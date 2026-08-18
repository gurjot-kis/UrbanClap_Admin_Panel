import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useGetActiveCategoriesQuery } from "../../../features/category/categoryApi";
import type {
  ProductFormState,
  CreateProductVariant,
} from "../../../features/product/productTypes";
import "../../../styles/product/AddProduct.css";
import type { Category } from "../../../features/category/categoryTypes";

const emptyVariant = (): CreateProductVariant => ({
  label: "",
  price: 0,
  costPrice: "",
  imageIndex: null,
});

const initialForm: ProductFormState = {
  name: "",
  description: "",
  shortDescription: "",
  category_id: "",
  sub_category_id: "",
  vendor_id: "",
  basePrice: "",
  variantLabel: "",
  durationMinutes: "",
  includes: [],
  variants: [],
  mainImage: null,
  featuredImages: [],
  variantImages: [],
};

// ---- tiny inline icon set (no external icon dependency) --------------------
const Icon = {
  Identity: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" />
    </svg>
  ),
  Layers: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M12 3 3 8l9 5 9-5-9-5Z" strokeLinejoin="round" />
      <path d="m3 13 9 5 9-5" strokeLinejoin="round" />
    </svg>
  ),
  Tag: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        d="M11 3h6a2 2 0 0 1 2 2v6l-9.5 9.5a1.5 1.5 0 0 1-2 0L3 16a1.5 1.5 0 0 1 0-2L11 3Z"
        strokeLinejoin="round"
      />
      <circle cx="15.5" cy="8.5" r="1.3" />
    </svg>
  ),
  List: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M9 6h11M9 12h11M9 18h11" strokeLinecap="round" />
      <circle cx="4.5" cy="6" r="1.4" />
      <circle cx="4.5" cy="12" r="1.4" />
      <circle cx="4.5" cy="18" r="1.4" />
    </svg>
  ),
  Variant: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </svg>
  ),
  Image: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path
        d="m21 16-5.5-5.5L6 20"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Close: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  ),
  Plus: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  ),
};

export default function CreateProductForm() {
  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useGetActiveCategoriesQuery();

  const categories: Category[] = categoriesResponse?.data ?? [];

  const [form, setForm] = useState<ProductFormState>(initialForm);
  const [selectedL1, setSelectedL1] = useState("");
  const [selectedL2, setSelectedL2] = useState("");
  const [selectedL3, setSelectedL3] = useState("");
  const [includeDraft, setIncludeDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const mainImageRef = useRef<HTMLInputElement>(null);
  const featuredImagesRef = useRef<HTMLInputElement>(null);
  const variantImagesRef = useRef<HTMLInputElement>(null);

  // ---- category cascade ------------------------------------------------
  const l1 = useMemo(
    () => categories.find((c) => c._id === selectedL1),
    [categories, selectedL1],
  );
  const l2options = l1?.children ?? [];
  const l2 = useMemo(
    () => l2options.find((c) => c._id === selectedL2),
    [l2options, selectedL2],
  );
  const l3options = l2?.children ?? [];
  const l3 = useMemo(
    () => l3options.find((c) => c._id === selectedL3),
    [l3options, selectedL3],
  );

  const categoryPath = [l1?.name, l2?.name, l3?.name]
    .filter(Boolean)
    .join(" / ");

  const handleSelectL1 = (id: string) => {
    setSelectedL1(id);
    setSelectedL2("");
    setSelectedL3("");
    setForm((f) => ({ ...f, category_id: id, sub_category_id: "" }));
  };

  const handleSelectL2 = (id: string) => {
    setSelectedL2(id);
    setSelectedL3("");
    setForm((f) => ({ ...f, sub_category_id: id }));
  };

  const handleSelectL3 = (id: string) => {
    setSelectedL3(id);
    setForm((f) => ({ ...f, sub_category_id: id }));
  };

  // ---- simple field helpers ---------------------------------------------
  const setField = <K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleText =
    (key: keyof ProductFormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setField(key, e.target.value as never);

  const handleNumber =
    (key: keyof ProductFormState) => (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setField(key, (raw === "" ? "" : Number(raw)) as never);
    };

  // ---- includes chips -----------------------------------------------------
  const addInclude = () => {
    const value = includeDraft.trim();
    if (!value) return;
    setField("includes", [...form.includes, value]);
    setIncludeDraft("");
  };

  const removeInclude = (index: number) =>
    setField(
      "includes",
      form.includes.filter((_, i) => i !== index),
    );

  // ---- variants -------------------------------------------------------
  const addVariant = () =>
    setField("variants", [...form.variants, emptyVariant()]);

  const updateVariant = (index: number, patch: Partial<CreateProductVariant>) =>
    setField(
      "variants",
      form.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    );

  const removeVariant = (index: number) =>
    setField(
      "variants",
      form.variants.filter((_, i) => i !== index),
    );

  // ---- images -----------------------------------------------------------
  const handleMainImage = (e: ChangeEvent<HTMLInputElement>) =>
    setField("mainImage", e.target.files?.[0] ?? null);

  const handleFeaturedImages = (e: ChangeEvent<HTMLInputElement>) =>
    setField("featuredImages", [
      ...form.featuredImages,
      ...Array.from(e.target.files ?? []),
    ]);

  const handleVariantImages = (e: ChangeEvent<HTMLInputElement>) =>
    setField("variantImages", [
      ...form.variantImages,
      ...Array.from(e.target.files ?? []),
    ]);

  const removeFeaturedImage = (index: number) =>
    setField(
      "featuredImages",
      form.featuredImages.filter((_, i) => i !== index),
    );

  const removeVariantImage = (index: number) =>
    setField(
      "variantImages",
      form.variantImages.filter((_, i) => i !== index),
    );

  // ---- submit -------------------------------------------------------------
  const buildFormData = () => {
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("description", form.description);
    fd.append("shortDescription", form.shortDescription);
    fd.append("category_id", form.category_id);
    fd.append("sub_category_id", form.sub_category_id);
    fd.append("vendor_id", form.vendor_id);
    fd.append("basePrice", String(form.basePrice));
    fd.append("variantLabel", form.variantLabel);
    fd.append("durationMinutes", String(form.durationMinutes));
    fd.append("includes", JSON.stringify(form.includes));
    fd.append("variants", JSON.stringify(form.variants));
    if (form.mainImage) fd.append("mainImage", form.mainImage);
    form.featuredImages.forEach((file) => fd.append("featuredImages", file));
    form.variantImages.forEach((file) => fd.append("variantImages", file));
    return fd;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);
    try {
      const formData = buildFormData();
      // Wire this up to your create-product mutation, e.g.:
      // await createProduct(formData).unwrap();
      await new Promise((resolve) => setTimeout(resolve, 700));
      void formData;
      setSubmitMessage("success");
    } catch {
      setSubmitMessage("error");
    } finally {
      setSubmitting(false);
    }
  };

  const previewJson = {
    name: form.name || "—",
    description: form.description || "—",
    shortDescription: form.shortDescription || "—",
    category_id: form.category_id || "—",
    sub_category_id: form.sub_category_id || "—",
    vendor_id: form.vendor_id || "—",
    basePrice: form.basePrice === "" ? "—" : form.basePrice,
    variantLabel: form.variantLabel || "—",
    durationMinutes: form.durationMinutes === "" ? "—" : form.durationMinutes,
    includes: form.includes,
    variants: form.variants,
    mainImage: form.mainImage?.name ?? "—",
    featuredImages: form.featuredImages.map((f) => f.name),
    variantImages: form.variantImages.map((f) => f.name),
  };

  return (
    <div className="cpf">
      <form className="cpf-form" onSubmit={handleSubmit}>
        <header className="cpf-header">
          <div>
            <p className="cpf-eyebrow">Catalog / New listing</p>
            <h1 className="cpf-title">Create product</h1>
            <p className="cpf-subtitle">
              Fill in each section — the spec sheet on the right updates as you
              go.
            </p>
          </div>
          <div className="cpf-header-actions">
            <button type="button" className="cpf-btn cpf-btn--ghost">
              Save draft
            </button>
            <button
              type="submit"
              className="cpf-btn cpf-btn--primary"
              disabled={submitting}
            >
              {submitting ? "Publishing…" : "Publish product"}
            </button>
          </div>
        </header>

        {submitMessage === "success" && (
          <div className="cpf-banner cpf-banner--success">
            Product payload built and ready to send.
          </div>
        )}
        {submitMessage === "error" && (
          <div className="cpf-banner cpf-banner--error">
            Something went wrong. Please try again.
          </div>
        )}

        {/* SECTION 1 — Identity */}
        <section className="cpf-section">
          <div className="cpf-section-head">
            <span className="cpf-section-icon">
              <Icon.Identity />
            </span>
            <div>
              <h2>Product identity</h2>
              <p>The name and descriptions shoppers see first.</p>
            </div>
          </div>
          <div className="cpf-grid">
            <label className="cpf-field cpf-field--full">
              <span>Product name</span>
              <input
                type="text"
                placeholder="e.g. Professional Ceramic Hair Straightener"
                value={form.name}
                onChange={handleText("name")}
                required
              />
            </label>
            <label className="cpf-field cpf-field--full">
              <span>Short description</span>
              <input
                type="text"
                placeholder="One line shown on listing cards"
                value={form.shortDescription}
                onChange={handleText("shortDescription")}
              />
            </label>
            <label className="cpf-field cpf-field--full">
              <span>Full description</span>
              <textarea
                rows={4}
                placeholder="Describe materials, use-case and what makes it stand out"
                value={form.description}
                onChange={handleText("description")}
              />
            </label>
          </div>
        </section>

        {/* SECTION 2 — Classification */}
        <section className="cpf-section">
          <div className="cpf-section-head">
            <span className="cpf-section-icon">
              <Icon.Layers />
            </span>
            <div>
              <h2>Classification</h2>
              <p>Where this product lives in the catalog tree.</p>
            </div>
          </div>
          <div className="cpf-grid">
            <label className="cpf-field">
              <span>Category</span>
              <select
                value={selectedL1}
                onChange={(e) => handleSelectL1(e.target.value)}
                disabled={categoriesLoading}
              >
                <option value="">
                  {categoriesLoading
                    ? "Loading categories…"
                    : "Select category"}
                </option>
                {categories.map((c: Category) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {categoriesError && (
                <em className="cpf-field-error">Couldn't load categories.</em>
              )}
            </label>

            <label className="cpf-field">
              <span>Sub-category</span>
              <select
                value={selectedL2}
                onChange={(e) => handleSelectL2(e.target.value)}
                disabled={!l2options.length}
              >
                <option value="">
                  {l2options.length
                    ? "Select sub-category"
                    : "No sub-categories"}
                </option>
                {l2options.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            {!!l3options.length && (
              <label className="cpf-field">
                <span>Specify</span>
                <select
                  value={selectedL3}
                  onChange={(e) => handleSelectL3(e.target.value)}
                >
                  <option value="">Select type</option>
                  {l3options.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="cpf-field">
              <span>Vendor</span>
              <select
                value={form.vendor_id}
                onChange={(e) => setField("vendor_id", e.target.value)}
                disabled
              >
                <option value="">No vendors added yet</option>
              </select>
              <em className="cpf-field-hint">
                Vendor management is coming soon — leave unassigned for now.
              </em>
            </label>
          </div>
          {categoryPath && <p className="cpf-breadcrumb">{categoryPath}</p>}
        </section>

        {/* SECTION 3 — Pricing & fulfilment */}
        <section className="cpf-section">
          <div className="cpf-section-head">
            <span className="cpf-section-icon">
              <Icon.Tag />
            </span>
            <div>
              <h2>Pricing &amp; fulfilment</h2>
              <p>Base price and how long the service or delivery takes.</p>
            </div>
          </div>
          <div className="cpf-grid">
            <label className="cpf-field">
              <span>Base price (₹)</span>
              <input
                type="number"
                min={0}
                placeholder="1299"
                value={form.basePrice}
                onChange={handleNumber("basePrice")}
                required
              />
            </label>
            <label className="cpf-field">
              <span>Variant label</span>
              <input
                type="text"
                placeholder="e.g. Select Size"
                value={form.variantLabel}
                onChange={handleText("variantLabel")}
              />
            </label>
            <label className="cpf-field">
              <span>Duration (minutes)</span>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={form.durationMinutes}
                onChange={handleNumber("durationMinutes")}
              />
            </label>
          </div>
        </section>

        {/* SECTION 4 — What's included */}
        <section className="cpf-section">
          <div className="cpf-section-head">
            <span className="cpf-section-icon">
              <Icon.List />
            </span>
            <div>
              <h2>What&apos;s included</h2>
              <p>Everything the customer receives in the box.</p>
            </div>
          </div>
          <div className="cpf-chip-input">
            <input
              type="text"
              placeholder="e.g. Heat Protection Glove"
              value={includeDraft}
              onChange={(e) => setIncludeDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addInclude();
                }
              }}
            />
            <button
              type="button"
              className="cpf-btn cpf-btn--secondary"
              onClick={addInclude}
            >
              <Icon.Plus /> Add
            </button>
          </div>
          <div className="cpf-chip-list">
            {form.includes.length === 0 && (
              <span className="cpf-empty">No items added yet.</span>
            )}
            {form.includes.map((item, i) => (
              <span className="cpf-chip" key={`${item}-${i}`}>
                {item}
                <button
                  type="button"
                  onClick={() => removeInclude(i)}
                  aria-label={`Remove ${item}`}
                >
                  <Icon.Close />
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* SECTION 5 — Variants */}
        <section className="cpf-section">
          <div className="cpf-section-head">
            <span className="cpf-section-icon">
              <Icon.Variant />
            </span>
            <div>
              <h2>Variants</h2>
              <p>Size, quantity or tier options with their own pricing.</p>
            </div>
          </div>

          {form.variants.length === 0 && (
            <span className="cpf-empty">No variants yet — add one below.</span>
          )}

          <div className="cpf-variant-list">
            {form.variants.map((variant, i) => (
              <div className="cpf-variant-row" key={i}>
                <input
                  type="text"
                  placeholder="Label (e.g. Small)"
                  value={variant.label}
                  onChange={(e) => updateVariant(i, { label: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={variant.price}
                  onChange={(e) =>
                    updateVariant(i, {
                      price:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
                <input
                  type="number"
                  placeholder="Cost price"
                  value={variant.costPrice}
                  onChange={(e) =>
                    updateVariant(i, {
                      costPrice:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
                <select
                  value={variant.imageIndex ?? ""}
                  onChange={(e) =>
                    updateVariant(i, {
                      imageIndex:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                >
                  <option value="">Image</option>
                  {form.featuredImages.map((file, idx) => (
                    <option
                      key={idx}
                      value={idx}
                    >{`#${idx} · ${file.name}`}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="cpf-icon-btn"
                  onClick={() => removeVariant(i)}
                  aria-label="Remove variant"
                >
                  <Icon.Close />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="cpf-btn cpf-btn--secondary"
            onClick={addVariant}
          >
            <Icon.Plus /> Add variant
          </button>
        </section>

        {/* SECTION 6 — Media */}
        <section className="cpf-section">
          <div className="cpf-section-head">
            <span className="cpf-section-icon">
              <Icon.Image />
            </span>
            <div>
              <h2>Media</h2>
              <p>
                Main listing image, gallery shots and variant-specific photos.
              </p>
            </div>
          </div>

          <div className="cpf-media-grid">
            <div className="cpf-media-block">
              <span className="cpf-media-label">Main image</span>
              <div
                className="cpf-dropzone"
                onClick={() => mainImageRef.current?.click()}
              >
                {form.mainImage ? (
                  <img
                    src={URL.createObjectURL(form.mainImage)}
                    alt="Main preview"
                  />
                ) : (
                  <span>Click to upload</span>
                )}
              </div>
              <input
                ref={mainImageRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleMainImage}
              />
            </div>

            <div className="cpf-media-block">
              <span className="cpf-media-label">Featured images</span>
              <div className="cpf-thumb-row">
                {form.featuredImages.map((file, i) => (
                  <div className="cpf-thumb" key={i}>
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Featured ${i}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeFeaturedImage(i)}
                      aria-label="Remove image"
                    >
                      <Icon.Close />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="cpf-thumb cpf-thumb--add"
                  onClick={() => featuredImagesRef.current?.click()}
                >
                  <Icon.Plus />
                </button>
              </div>
              <input
                ref={featuredImagesRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleFeaturedImages}
              />
            </div>

            <div className="cpf-media-block">
              <span className="cpf-media-label">Variant images</span>
              <div className="cpf-thumb-row">
                {form.variantImages.map((file, i) => (
                  <div className="cpf-thumb" key={i}>
                    <img src={URL.createObjectURL(file)} alt={`Variant ${i}`} />
                    <button
                      type="button"
                      onClick={() => removeVariantImage(i)}
                      aria-label="Remove image"
                    >
                      <Icon.Close />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="cpf-thumb cpf-thumb--add"
                  onClick={() => variantImagesRef.current?.click()}
                >
                  <Icon.Plus />
                </button>
              </div>
              <input
                ref={variantImagesRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleVariantImages}
              />
            </div>
          </div>
        </section>
      </form>

      {/* PREVIEW RAIL */}
      <aside className="cpf-preview">
        <div className="cpf-preview-sticky">
          <div className="cpf-tag-card">
            <div className="cpf-tag-hole" />
            <div className="cpf-tag-image">
              {form.mainImage ? (
                <img src={URL.createObjectURL(form.mainImage)} alt="Product" />
              ) : (
                <span>No image</span>
              )}
            </div>
            <p className="cpf-tag-category">
              {categoryPath || "Uncategorised"}
            </p>
            <h3 className="cpf-tag-name">{form.name || "Untitled product"}</h3>
            <p className="cpf-tag-short">
              {form.shortDescription || "Short description will appear here."}
            </p>
            <div className="cpf-tag-price">
              <span>{form.basePrice === "" ? "₹—" : `₹${form.basePrice}`}</span>
              {form.durationMinutes !== "" && (
                <em>{form.durationMinutes} min</em>
              )}
            </div>
            {form.includes.length > 0 && (
              <ul className="cpf-tag-includes">
                {form.includes.slice(0, 4).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
                {form.includes.length > 4 && (
                  <li>+{form.includes.length - 4} more</li>
                )}
              </ul>
            )}
          </div>

          <div className="cpf-payload">
            <div className="cpf-payload-head">
              <span>form-data payload</span>
              <span className="cpf-payload-dot" />
            </div>
            <pre>{JSON.stringify(previewJson, null, 2)}</pre>
          </div>
        </div>
      </aside>
    </div>
  );
}
