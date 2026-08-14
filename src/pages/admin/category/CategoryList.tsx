import { useEffect, useMemo, useState } from "react";
import {
  useGetCategoriesQuery,
  useUpadteCategoryStatusMutation,
} from "../../../features/category/categoryApi";
import type { Category } from "../../../features/category/categoryTypes";
import {
  buildPageWindow,
  countAll,
  flattenRows,
  LEVEL_LABEL,
  resolveImageUrl,
} from "../../../features/category/categoryHelpers";
import "../../../styles/category/CategoryList.css";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const PAGE_LIMIT = 10; 

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    className={`cl-chevron ${expanded ? "cl-chevron--open" : ""}`}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      d="M9 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path
      d="M21 21l-4.3-4.3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ChevronLeft = () => (
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

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M9 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StatusToggle = ({
  active,
  isUpdating,
  onChange,
}: {
  active: boolean;
  isUpdating: boolean;
  onChange: () => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={active}
    disabled={isUpdating}
    className={`cl-switch ${active ? "cl-switch--on" : "cl-switch--off"} ${isUpdating ? "cl-switch--busy" : ""}`}
    onClick={onChange}
  >
    <span className="cl-switch-track">
      <span className="cl-switch-thumb" />
    </span>
    <span className="cl-switch-label">
      {isUpdating ? "…" : active ? "Active" : "Inactive"}
    </span>
  </button>
);

const CategoryList = () => {
  const [page, setPage] = useState(1);
  const [levelFilter, setLevelFilter] = useState<number | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetCategoriesQuery({
      page,
      limit: PAGE_LIMIT,
      search: search || undefined,
      level: levelFilter === "all" ? undefined : levelFilter,
    });

  const [updateCategoryStatus] = useUpadteCategoryStatusMutation();

  const categories = data?.data ?? [];
  const pagination = data?.pagination;

  const rows = useMemo(
    () => flattenRows(categories, 0, expandedIds),
    [categories, expandedIds],
  );
  const stats = useMemo(() => countAll(categories), [categories]);

  const toggleRow = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleStatus = async (category: Category) => {
    setUpdatingId(category._id);
    try {
      await updateCategoryStatus(category._id).unwrap();
    } catch (err) {
      console.error("Failed to update category status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLevelChange = (value: string) => {
    setLevelFilter(value === "all" ? "all" : Number(value));
    setPage(1);
  };

  const goToPage = (next: number) => {
    if (!pagination) return;
    if (next < 1 || next > pagination.totalPages) return;
    setPage(next);
  };

  const rangeStart = pagination
    ? (pagination.page - 1) * pagination.limit + 1
    : 0;
  const rangeEnd = pagination
    ? Math.min(pagination.page * pagination.limit, pagination.total)
    : 0;
  const pageWindow = pagination
    ? buildPageWindow(pagination.page, pagination.totalPages)
    : [];



  return (
    <div className="cl-page">
      {/* Header */}
      <div className="card border-0 rounded-3 shadow-sm cl-header-card">
        <div className="card-body p-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h1 className="cl-title mb-0">Categories</h1>
              <div className="d-flex gap-2 mt-2 flex-wrap">
                <span className="cl-stat-pill cl-stat-pill--navy">
                  {pagination?.total ?? stats.total} total
                </span>
                <span className="cl-stat-pill">
                  {stats.byLevel[2] ?? 0} sub-categories · this page
                </span>
                <span className="cl-stat-pill">
                  {stats.byLevel[3] ?? 0} services · this page
                </span>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 align-items-center">
              <select
                className="form-select form-select-sm cl-filter-select"
                value={levelFilter}
                onChange={(e) => handleLevelChange(e.target.value)}
              >
                <option value="all">All levels</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
              </select>

              <div className="cl-search-wrap">
                <span className="cl-search-icon">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  placeholder="Search categories..."
                  className="form-control form-control-sm cl-search-input"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="cl-create-btn"
                onClick={() => navigate("/admin/categories/new")}
              >
                <span className="cl-create-plus">+</span> Add Category
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 rounded-3 shadow-sm cl-table-card">
        <div className="cl-table-scroll">
          <table className="cl-table">
            <thead>
              <tr>
                <th className="cl-col-name">Category</th>
                <th className="cl-col-level d-none d-md-table-cell">Level</th>
                <th className="cl-col-desc d-none d-lg-table-cell">
                  Description
                </th>
                <th className="cl-col-status">Status</th>
                <th className="cl-col-actions text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="cl-row-skeleton">
                    <td colSpan={5}>
                      <div className="cl-skeleton-bar" />
                    </td>
                  </tr>
                ))}

              {!isLoading && isError && (
                <tr>
                  <td colSpan={5}>
                    <div className="cl-state cl-state--error">
                      <p className="mb-2">
                        Couldn't load categories
                        {error && "status" in error ? ` (${error.status})` : ""}
                        .
                      </p>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => refetch()}
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && rows.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="cl-state">
                      {search
                        ? `No categories match "${search}".`
                        : "No categories yet."}
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                rows.map(({ category, depth, hasChildren, isExpanded }) => {
                  const imageUrl = resolveImageUrl(category.category_image);

                  return (
                    <tr
                      key={category._id}
                      className={`cl-row cl-row--depth-${Math.min(depth, 2)}`}
                    >
                      <td className="cl-col-name">
                        <div
                          className="cl-name-cell"
                          style={{ paddingLeft: depth * 24 }}
                        >
                          {hasChildren ? (
                            <button
                              type="button"
                              className="cl-expand-btn"
                              onClick={() => toggleRow(category._id)}
                              aria-label={isExpanded ? "Collapse" : "Expand"}
                            >
                              <ChevronIcon expanded={isExpanded} />
                            </button>
                          ) : (
                            <span className="cl-expand-spacer" />
                          )}

                          <span className="cl-thumb">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt=""
                                onError={(e) => {
                                  (
                                    e.currentTarget as HTMLImageElement
                                  ).style.display = "none";
                                  e.currentTarget.nextElementSibling?.classList.remove(
                                    "d-none",
                                  );
                                }}
                              />
                            ) : null}
                            <span
                              className={`cl-thumb-fallback ${imageUrl ? "d-none" : ""}`}
                            >
                              <ImageIcon />
                            </span>
                          </span>

                          <span className="cl-name-text">
                            <span className="cl-name">{category.name}</span>
                            <span className="cl-level-tag cl-level-tag--inline d-md-none">
                              {LEVEL_LABEL[category.level] ??
                                `L${category.level}`}
                            </span>
                          </span>
                        </div>
                      </td>

                      <td className="cl-col-level d-none d-md-table-cell">
                        <span
                          className={`cl-level-tag cl-level-tag--${category.level}`}
                        >
                          {LEVEL_LABEL[category.level] ?? `L${category.level}`}
                        </span>
                      </td>

                      <td className="cl-col-desc d-none d-lg-table-cell">
                        <span
                          className="cl-desc-text"
                          title={category.description}
                        >
                          {category.description || "—"}
                        </span>
                      </td>

                      {/* FIXED: was a <td> nested inside a <td> here */}
                      <td className="cl-col-status">
                        <StatusToggle
                          active={category.status === "active"}
                          isUpdating={updatingId === category._id}
                          onChange={() => handleToggleStatus(category)}
                        />
                      </td>

                      <td className="cl-col-actions text-end">
                        <div className="cl-actions">
                          <button
                            type="button"
                            className="cl-icon-btn"
                            title="Edit"
                          >
                            <MdModeEdit color="#1b3a5c" />
                          </button>
                          <button
                            type="button"
                            className="cl-icon-btn cl-icon-btn--danger"
                            title="Delete"
                          >
                            <MdDelete color="red" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {isFetching && !isLoading && <div className="cl-refetch-bar" />}

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="cl-pagination">
            <span className="cl-pagination-info">
              Showing <strong>{rangeStart}</strong>–<strong>{rangeEnd}</strong>{" "}
              of <strong>{pagination.total}</strong>
            </span>

            <div className="cl-pagination-controls">
              <button
                type="button"
                className="cl-pagination-btn"
                disabled={!pagination.hasPrevPage}
                onClick={() => goToPage(pagination.page - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft />
              </button>

              {pageWindow.map((p, i) =>
                p === "…" ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="cl-pagination-ellipsis"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    className={`cl-pagination-num ${p === pagination.page ? "cl-pagination-num--active" : ""}`}
                    onClick={() => goToPage(p)}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                type="button"
                className="cl-pagination-btn"
                disabled={!pagination.hasNextPage}
                onClick={() => goToPage(pagination.page + 1)}
                aria-label="Next page"
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryList;
