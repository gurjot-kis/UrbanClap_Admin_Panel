import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LuPhone, LuMail, LuMapPin } from "react-icons/lu";
import { MdModeEdit } from "react-icons/md";
import { useNavigate } from "react-router-dom";

import {
  useGetAllUsersQuery,
  useUpdateUserStatusMutation,
} from "../../../features/user/userApi";
import type { User, UserStatus } from "../../../features/user/userTypes";
import {
  DataTable,
  DataTableStatusToggle,
} from "../../../components/common/DataTable/DataTable";
import type { DataTableColumn } from "../../../components/common/DataTable/DataTable.types";
import { useHeader } from "../../../layout/LayoutContext";
import "../../../styles/user/UserList.css";

const PAGE_LIMIT = 10;

export default function UserList(): React.ReactElement {
  const navigate = useNavigate();
  const { setHeaderConfig } = useHeader();

  const [page, setPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setHeaderConfig({
      title: "Users Management",
      subtitle:
        "View and manage system users, access status, and contact details",
    });
  }, [setHeaderConfig]);

  // Debounced search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const activeStatusQuery: UserStatus | undefined =
    statusFilter === "all" ? undefined : (Number(statusFilter) as UserStatus);

  // RTK Query Hooks
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetAllUsersQuery({
      page,
      limit: PAGE_LIMIT,
      status: activeStatusQuery,
    });

  const [updateUserStatus] = useUpdateUserStatusMutation();

  const rawUsers = data?.data ?? [];
  const pagination = data?.pagination;

  // Filter client-side if full-text search is not part of API params
  const users = useMemo(() => {
    if (!search) return rawUsers;
    const lower = search.toLowerCase();
    return rawUsers.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(lower) ||
        u.email?.toLowerCase().includes(lower) ||
        u.phone?.toLowerCase().includes(lower),
    );
  }, [rawUsers, search]);

  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === 1).length;
    const inactive = users.filter((u) => u.status === 0).length;
    return { active, inactive, total: pagination?.total ?? users.length };
  }, [users, pagination]);

  const handleToggleStatus = async (user: User) => {
    const newStatus: UserStatus = user.status === 1 ? 0 : 1;
    setUpdatingId(user.user_id);

    try {
      await updateUserStatus({
        userId: user.user_id,
        payload: { status: newStatus },
      }).unwrap();

      toast.success("Status updated", {
        description: `"${user.fullName || "User"}" is now ${
          newStatus === 1 ? "Active" : "Inactive"
        }.`,
      });
    } catch (err: any) {
      console.error("Failed to update user status:", err);
      toast.error("Failed to update status", {
        description:
          err?.data?.message ||
          "Could not update user status. Please try again.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return "U";

    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    const firstLetter = words[0].charAt(0).toUpperCase();
    const lastLetter = words[words.length - 1].charAt(0).toUpperCase();

    return `${firstLetter}${lastLetter}`;
  };

  const columns: DataTableColumn<User>[] = [
    {
      key: "fullName",
      header: "User",
      isPrimary: true,
      render: (user) => (
        <div className="user-table-profile">
          <div className="user-table-avatar">{getInitials(user.fullName)}</div>
          <div className="user-table-name-wrapper">
            <span className="user-table-name">{user.fullName || "—"}</span>
            <span className="user-table-subtext d-md-none">
              {user.email || user.phone}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      headerClassName: "d-none d-md-table-cell",
      cellClassName: "d-none d-md-table-cell",
      render: (user) => (
        <span className="user-table-contact-text">
          <LuMail size={14} className="user-table-icon" />
          <span>{user.email || "—"}</span>
        </span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      headerClassName: "d-none d-lg-table-cell",
      cellClassName: "d-none d-lg-table-cell",
      render: (user) => (
        <span className="user-table-contact-text">
          <LuPhone size={14} className="user-table-icon" />
          <span>{user.phone || "—"}</span>
        </span>
      ),
    },
    {
      key: "address",
      header: "Address",
      headerClassName: "d-none d-xl-table-cell",
      cellClassName: "d-none d-xl-table-cell",
      render: (user) => (
        <span className="user-table-address-text" title={user.address}>
          <LuMapPin size={14} className="user-table-icon" />
          <span>{user.address || "—"}</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user) => (
        <div className="user-table-status-wrapper">
          <DataTableStatusToggle
            active={user.status === 1}
            isUpdating={updatingId === user.user_id}
            onChange={() => handleToggleStatus(user)}
          />
        </div>
      ),
    },
    // {
    //   key: "actions",
    //   header: "Actions",
    //   headerClassName: "text-end",
    //   cellClassName: "text-end",
    //   render: (user) => (
    //     <div className="user-table-actions">
    //       <button
    //         type="button"
    //         className="user-table-action-btn"
    //         title="Edit User"
    //         onClick={() => navigate(`/admin/users/${user.user_id}/edit`)}
    //       >
    //         <MdModeEdit size={18} />
    //       </button>
    //     </div>
    //   ),
    // },
  ];

  return (
    <div className="user-list-page">
      <DataTable
        statPills={[
          { label: `${stats.total} total users`, navy: true },
          { label: `${stats.active} active · this page` },
          { label: `${stats.inactive} inactive · this page` },
        ]}
        columns={columns}
        data={users}
        getId={(u) => u.user_id}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by name, email, or phone..."
        filters={[
          {
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v);
              setPage(1);
            },
            options: [
              { value: "all", label: "All Status" },
              { value: "1", label: "Active" },
              { value: "0", label: "Inactive" },
            ],
          },
        ]}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorMessage={`Couldn't load users${
          error && "status" in error ? ` (${error.status})` : ""
        }.`}
        onRetry={refetch}
        emptyMessage={
          search ? `No users match "${search}".` : "No users found in records."
        }
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
