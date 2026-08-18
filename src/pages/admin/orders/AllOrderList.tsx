import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MdOutlineVisibility } from "react-icons/md";
import {
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
} from "../../../features/order/orderApi";
import type {
  Order,
  OrderStatus,
  PaymentStatus,
} from "../../../features/order/orderTypes";
import { DataTable } from "../../../components/common/DataTable/DataTable";
import type { DataTableColumn } from "../../../components/common/DataTable/DataTable.types";
import "../../../styles/order/OrderList.css";

const PAGE_LIMIT = 10;

const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; dotColor: string }
> = {
  pending: { label: "Pending", dotColor: "#f59e0b" },
  confirmed: { label: "Confirmed", dotColor: "#3b82f6" },
  processing: { label: "Processing", dotColor: "#8b5cf6" },
  shipped: { label: "Shipped", dotColor: "#06b6d4" },
  delivered: { label: "Delivered", dotColor: "#10b981" },
  completed: { label: "Completed", dotColor: "#10b981" },
  cancelled: { label: "Cancelled", dotColor: "#ef4444" },
};

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  paid: { label: "Paid", className: "ol-badge--paid" },
  pending: { label: "Pending", className: "ol-badge--pending" },
  failed: { label: "Failed", className: "ol-badge--failed" },
  refunded: { label: "Refunded", className: "ol-badge--refunded" },
};

/* Table Row Status Dropdown with React Portal */
interface OrderStatusSelectProps {
  status: OrderStatus;
  isUpdating?: boolean;
  onChange: (status: OrderStatus) => void;
}

const OrderStatusSelect = ({
  status,
  isUpdating,
  onChange,
}: OrderStatusSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{
    top: number;
    left: number;
    openUpwards: boolean;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 260;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards =
      spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setMenuCoords({
      top: openUpwards ? rect.top - 6 : rect.bottom + 6,
      left: rect.left,
      openUpwards,
    });
  };

  const handleToggle = () => {
    if (!isOpen) {
      updateMenuPosition();
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updateMenuPosition();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  const currentConfig =
    ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pending;

  return (
    <div
      className={`ol-status-dropdown ${
        isUpdating ? "ol-status-dropdown--busy" : ""
      }`}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={isUpdating}
        onClick={handleToggle}
        className={`ol-status-trigger ol-status-trigger--${status} ${
          isOpen ? "ol-status-trigger--open" : ""
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className="ol-status-dot-pulse"
          style={{ backgroundColor: currentConfig.dotColor }}
        />
        <span className="ol-status-label">{currentConfig.label}</span>
        <svg
          className={`ol-status-chevron ${
            isOpen ? "ol-status-chevron--rotate" : ""
          }`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen &&
        menuCoords &&
        createPortal(
          <div
            ref={menuRef}
            className={`ol-status-menu ${
              menuCoords.openUpwards ? "ol-status-menu--up" : ""
            }`}
            style={{
              position: "fixed",
              top: menuCoords.openUpwards ? "auto" : `${menuCoords.top}px`,
              bottom: menuCoords.openUpwards
                ? `${window.innerHeight - menuCoords.top}px`
                : "auto",
              left: `${menuCoords.left}px`,
              zIndex: 999999,
            }}
            role="listbox"
          >
            {(Object.keys(ORDER_STATUS_CONFIG) as OrderStatus[]).map((key) => {
              const item = ORDER_STATUS_CONFIG[key];
              const isSelected = key === status;

              return (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`ol-status-option ${
                    isSelected ? "ol-status-option--selected" : ""
                  }`}
                  onClick={() => {
                    setIsOpen(false);
                    onChange(key);
                  }}
                >
                  <span
                    className="ol-status-option-dot"
                    style={{ backgroundColor: item.dotColor }}
                  />
                  <span className="ol-status-option-text">{item.label}</span>
                  {isSelected && (
                    <svg
                      className="ol-status-check"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
};

const AllOrderList = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetAllOrdersQuery({
      page,
      limit: PAGE_LIMIT,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
    });

  const [updateOrderStatus, { isLoading: isUpdatingStatus }] =
    useUpdateOrderStatusMutation();

  const orders = data?.data ?? [];
  const pagination = data?.pagination;

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    if (newStatus === order.status) return;

    try {
      await updateOrderStatus({
        orderId: order._id,
        status: newStatus,
      }).unwrap();

      toast.success("Order status updated", {
        description: `Order ${order.orderNumber} is now marked as ${newStatus}.`,
      });
    } catch (err: any) {
      console.error("Failed to update order status:", err);

      toast.error("Failed to update status", {
        description:
          err?.data?.message || "Something went wrong. Please try again.",
      });
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const columns: DataTableColumn<Order>[] = [
    {
      key: "orderNumber",
      header: "Order ID",
      isPrimary: true,
      render: (order) => (
        <div className="ol-order-info">
          <span className="ol-order-number" title={order.orderNumber}>
            {order.orderNumber}
          </span>
          <span className="ol-order-date d-md-none">
            {formatDate(order.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (order) => (
        <div className="ol-customer">
          <span className="ol-customer-name" title={order.customer?.name}>
            {order.customer?.name || "N/A"}
          </span>
          <span className="ol-customer-email" title={order.customer?.email}>
            {order.customer?.email}
          </span>
        </div>
      ),
    },
    {
      key: "totalItems",
      header: "Items",
      headerClassName: "d-none d-md-table-cell text-center",
      cellClassName: "d-none d-md-table-cell text-center",
      render: (order) => <span className="ol-items">{order.totalItems}</span>,
    },
    {
      key: "grandTotal",
      header: "Amount",
      render: (order) => (
        <span className="ol-price">{formatCurrency(order.grandTotal)}</span>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      headerClassName: "d-none d-lg-table-cell",
      cellClassName: "d-none d-lg-table-cell",
      render: (order) => {
        const payConfig =
          PAYMENT_STATUS_CONFIG[order.paymentStatus] ||
          PAYMENT_STATUS_CONFIG.pending;
        return (
          <div className="ol-payment-col">
            <span className="ol-payment-method">
              {order.paymentMethod.toUpperCase()}
            </span>
            <span className={`ol-badge ${payConfig.className}`}>
              {payConfig.label}
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (order) => (
        <OrderStatusSelect
          status={order.status}
          isUpdating={isUpdatingStatus}
          onChange={(newStatus) => handleStatusChange(order, newStatus)}
        />
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (order) => (
        <span className="ol-date">{formatDate(order.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (order) => (
        <div className="ol-actions">
          <button
            type="button"
            className="ol-icon-btn"
            title="View details"
            onClick={() => navigate(`/admin/orders/${order._id}/details`)}
          >
            <MdOutlineVisibility color="#1b3a5c" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      title="All Orders"
      statPills={[
        {
          label: `${pagination?.total ?? orders.length} total`,
          navy: true,
        },
      ]}
      columns={columns}
      data={orders}
      getId={(order) => order._id}
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Search by order ID, customer..."
      filters={[
        {
          value: statusFilter,
          onChange: (v) => {
            setStatusFilter(v as OrderStatus | "all");
            setPage(1);
          },
          options: [
            { value: "all", label: "All Status" },
            { value: "pending", label: "Pending" },
            { value: "confirmed", label: "Confirmed" },
            { value: "processing", label: "Processing" },
            { value: "shipped", label: "Shipped" },
            { value: "delivered", label: "Delivered" },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" },
          ],
        },
      ]}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      errorMessage={`Couldn't load orders${
        error && "status" in error ? ` (${error.status})` : ""
      }.`}
      onRetry={refetch}
      emptyMessage={
        search || statusFilter !== "all"
          ? "No orders match your filter criteria."
          : "No orders found."
      }
      pagination={
        pagination
          ? {
              page: pagination.page,
              limit: pagination.limit,
              total: pagination.total,
              totalPages: pagination.pages,
              hasNextPage: pagination.page < pagination.pages,
              hasPrevPage: pagination.page > 1,
            }
          : undefined
      }
      onPageChange={setPage}
    />
  );
};

export default AllOrderList;
