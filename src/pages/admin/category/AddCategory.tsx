import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
} from "../../../features/category/categoryApi";
import { flattenForParentOptions } from "../../../features/category/categoryHelpers";
import "../../../styles/category/AddCategory.css";

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M15 6l-6 6 6 6"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UploadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 16V4M12 4l-4 4M12 4l4 4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ImagePlaceholderIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="3"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <circle cx="8.5" cy="8.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M21 15l-5-5-9 9"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const AddCategory = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [allowInstant, setAllowInstant] = useState(true);
  const [allowSchedule, setAllowSchedule] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const { data } = useGetCategoriesQuery({ limit: 100 });
  const [createCategory, { isLoading: isSubmitting }] =
    useCreateCategoryMutation();

  const parentOptions = useMemo(
    () => flattenForParentOptions(data?.data ?? []),
    [data],
  );
  const selectedParent = parentOptions.find((p) => p._id === parentId);
  const resultingLevel = selectedParent ? selectedParent.level + 1 : 1;

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    if (parentId) formData.append("parent_id", parentId);
    formData.append("description", description.trim());
    if (imageFile) formData.append("category_image", imageFile);
    formData.append(
      "slotConfig",
      JSON.stringify({ allowInstant, allowSchedule }),
    );

    try {
      await createCategory(formData).unwrap();
      navigate("/categories");
    } catch (err) {
      console.error("Failed to create category:", err);
      setFormError("Couldn't create the category. Please try again.");
    }
  };

  return (
    <div className="add-cate-page">
      <div className="add-cate-header">
        <button
          type="button"
          className="add-cate-back-btn"
          onClick={() => navigate(-1)}
        >
          <BackIcon />
        </button>
        <div>
          <span className="add-cate-eyebrow">Categories / New</span>
          <h1 className="add-cate-title">Add Category</h1>
        </div>
      </div>

      <div className="add-cate-layout">
        {/* Main form */}
        <form onSubmit={handleSubmit} className="add-cate-card add-cate-form">
          <section className="add-cate-section">
            <h2 className="add-cate-section-title">Basic Details</h2>
            <div className="add-cate-row">
              <div className="add-cate-field">
                <label className="add-cate-label">Category Name</label>
                <input
                  type="text"
                  className="form-control form-control-sm add-cate-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Android Phones"
                  autoFocus
                />
              </div>

              <div className="add-cate-field">
                <label className="add-cate-label">Parent Category</label>
                <select
                  className="form-select form-select-sm add-cate-input"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                >
                  <option value="">— None (top-level) —</option>
                  {parentOptions.map((opt) => (
                    <option key={opt._id} value={opt._id}>
                      {"—".repeat(opt.depth)} {opt.name}
                    </option>
                  ))}
                </select>
                <span className="add-cate-hint">
                  Will be created as Level {resultingLevel}
                </span>
              </div>
            </div>

            <div className="add-cate-field">
              <label className="add-cate-label">Description</label>
              <textarea
                className="form-control form-control-sm add-cate-input"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description shown to customers"
              />
            </div>
          </section>

          <div className="add-cate-divider" />

          <section className="add-cate-section">
            <h2 className="add-cate-section-title">Media</h2>
            <label className="add-cate-dropzone">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="add-cate-preview-img"
                />
              ) : (
                <span className="add-cate-dropzone-content">
                  <UploadIcon />
                  <span>Click to upload an image</span>
                  <span className="add-cate-dropzone-sub">
                    PNG or JPG, up to 5MB
                  </span>
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
              />
            </label>
            {imageFile && (
              <button
                type="button"
                className="add-cate-remove-img"
                onClick={() => handleImageChange(null)}
              >
                Remove image
              </button>
            )}
          </section>

          <div className="add-cate-divider" />

          <section className="add-cate-section">
            <h2 className="add-cate-section-title">Booking Options</h2>
            <div className="add-cate-slot-group">
              <div className="add-cate-slot-row">
                <div>
                  <span className="add-cate-slot-title">
                    Allow Instant Booking
                  </span>
                  <span className="add-cate-slot-desc">
                    Customers can book on demand
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={allowInstant}
                  className={`add-cate-switch ${allowInstant ? "add-cate-switch--on" : ""}`}
                  onClick={() => setAllowInstant((v) => !v)}
                >
                  <span className="add-cate-switch-thumb" />
                </button>
              </div>

              <div className="add-cate-slot-row">
                <div>
                  <span className="add-cate-slot-title">
                    Allow Scheduled Booking
                  </span>
                  <span className="add-cate-slot-desc">
                    Customers can pick a future slot
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={allowSchedule}
                  className={`add-cate-switch ${allowSchedule ? "add-cate-switch--on" : ""}`}
                  onClick={() => setAllowSchedule((v) => !v)}
                >
                  <span className="add-cate-switch-thumb" />
                </button>
              </div>
            </div>
          </section>

          {formError && <p className="add-cate-error">{formError}</p>}

          <div className="add-cate-actions">
            <button
              type="button"
              className="add-cate-cancel-btn"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="add-cate-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating…" : "Create Category"}
            </button>
          </div>
        </form>

        {/* Live preview sidebar */}
        <aside className="add-cate-card add-cate-preview">
          <h2 className="add-cate-section-title">Live Preview</h2>

          <div className="add-cate-preview-thumb">
            {imagePreview ? (
              <img src={imagePreview} alt="" />
            ) : (
              <span className="add-cate-preview-placeholder">
                <ImagePlaceholderIcon />
              </span>
            )}
          </div>

          <div className="add-cate-preview-name">
            {name.trim() || "Category name"}
          </div>
          <div className="add-cate-preview-desc">
            {description.trim() ||
              "Description will appear here once you start typing."}
          </div>

          <div className="add-cate-preview-tags">
            <span className="add-cate-preview-level">
              Level {resultingLevel}
            </span>
            {selectedParent && (
              <span className="add-cate-preview-parent">
                under {selectedParent.name}
              </span>
            )}
          </div>

          <div className="add-cate-preview-booking">
            <span
              className={`add-cate-preview-chip ${allowInstant ? "add-cate-preview-chip--on" : ""}`}
            >
              Instant {allowInstant ? "On" : "Off"}
            </span>
            <span
              className={`add-cate-preview-chip ${allowSchedule ? "add-cate-preview-chip--on" : ""}`}
            >
              Scheduled {allowSchedule ? "On" : "Off"}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AddCategory;
