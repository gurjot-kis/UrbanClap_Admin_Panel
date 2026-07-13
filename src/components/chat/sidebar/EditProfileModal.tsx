import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { updateUser } from "../../../features/auth/authSlice";
import { useUpdateProfileMutation, useUploadAvatarMutation } from "../../../features/auth/authApi";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("male");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name);
      setGender(user.gender || "male");
      setBio(user.bio || "Hey there! I am using Chat.");
      setAvatarPreview(user.avatar || null);
      setAvatarFile(null);
      setError("");
      setSuccess("");
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      let finalAvatarUrl = user?.avatar || "";

      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const uploadRes = await uploadAvatar(formData).unwrap();
        if (uploadRes.success) {
          finalAvatarUrl = uploadRes.data.avatarUrl;
        }
      }

      const response = await updateProfile({
        name: name.trim(),
        gender,
        bio: bio.trim(),
        avatar: finalAvatarUrl,
      }).unwrap();

      if (response.success && response.data) {
        dispatch(updateUser(response.data));
        setSuccess("Profile updated successfully");
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Failed to update profile");
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 rounded-4 shadow-lg">
          {/* Header */}
          <div
            className="modal-header border-0 text-white rounded-top-4"
            style={{ background: "linear-gradient(135deg, #1b3a5c, #2a527d)" }}
          >
            <h5 className="modal-title fw-bold">Edit Profile</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          <form onSubmit={handleSave}>
            <div className="modal-body p-4">
              {error && (
                <div className="alert alert-danger py-2 small" role="alert">
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success py-2 small" role="alert">
                  {success}
                </div>
              )}

              {/* Avatar Edit */}
              <div className="d-flex flex-column align-items-center mb-4">
                <div
                  onClick={() => document.getElementById("edit-avatar-input")?.click()}
                  className="position-relative border border-2 border-dashed rounded-circle overflow-hidden d-flex align-items-center justify-content-center cursor-pointer"
                  style={{
                    width: "90px",
                    height: "90px",
                    borderColor: "#7da8cc",
                    backgroundColor: "#f8fafc",
                    cursor: "pointer",
                  }}
                >
                  {avatarPreview ? (
                    <img
                      src={
                        avatarPreview.startsWith("blob:")
                          ? avatarPreview
                          : `${(import.meta.env.VITE_SOCKET_URL as string) || "http://localhost:5000"}${avatarPreview}`
                      }
                      alt="Avatar preview"
                      className="w-100 h-100 object-fit-cover"
                    />
                  ) : (
                    <div className="text-center text-secondary">
                      <svg
                        className="mb-1"
                        width="24"
                        height="24"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <div style={{ fontSize: "9px" }}>Upload</div>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div
                    className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center bg-black bg-opacity-40 text-white opacity-0 hover-opacity-100"
                    style={{
                      transition: "opacity 0.2s",
                      left: 0,
                      top: 0,
                    }}
                  >
                    <span style={{ fontSize: "11px" }}>Change</span>
                  </div>
                </div>
                <input
                  id="edit-avatar-input"
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Name Field */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>

              {/* Gender Field */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">Gender</label>
                <select
                  className="form-select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unknown">Other / Unspecified</option>
                </select>
              </div>

              {/* Bio Field */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">About / Bio</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  maxLength={150}
                  style={{ resize: "none" }}
                />
                <div className="text-end small text-muted mt-1" style={{ fontSize: "11px" }}>
                  {bio.length}/150
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-0">
              <button
                type="button"
                className="btn btn-outline-secondary px-4 rounded-pill btn-sm"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary px-4 rounded-pill btn-sm"
                style={{ backgroundColor: "#1b3a5c", borderColor: "#1b3a5c" }}
                disabled={isSaving || isUploading}
              >
                {(isSaving || isUploading) && (
                  <span className="spinner-border spinner-border-sm me-1" role="status" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
