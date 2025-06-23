// components/ui/EditProfileModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useActionState } from "react";
import { updateProfile } from "@/app/lib/usersAction";
import SubmitButton from "../ui/SubmitButton";
import Image from "next/image";
import { FiUser, FiImage, FiLock, FiX, FiEye, FiEyeOff } from "react-icons/fi";

interface EditProfileModalProps {
  user: User;
}

export default function EditProfileModal({ user }: EditProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const initialState = {
    errors: {} as Record<string, string[]>,
    state_error: null,
    message: null,
  };

  const [state, formAction, isPending] = useActionState(
    updateProfile,
    initialState
  );

  // Only for edit: avatar file + preview URL
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatarUrl || null
  );

  // When an avatarFile is selected, generate a data-URL preview
  useEffect(() => {
    if (!avatarFile) {
      return setAvatarPreview(user?.avatarUrl || null);
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(avatarFile);
  }, [avatarFile, user]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow transition-all hover:shadow-md"
      >
        <FiUser className="text-lg" />
        <span>Edit Profile</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FiUser className="text-indigo-500" />
                    <span>Edit Profile</span>
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Update your account information
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiX className="text-xl text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {state.state_error && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
                  {state.state_error}
                </div>
              )}

              {state.message && (
                <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                  {state.message}
                </div>
              )}

              <form action={formAction} className="space-y-5">
                <input type="hidden" name="id" value={user.id} />

                {/* --- only when editing: avatar picker + preview --- */}
                {user && (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <FiImage className="text-gray-500" />
                      <span>Avatar</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        {avatarPreview ? (
                          <Image
                            src={avatarPreview}
                            alt="avatar preview"
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            —
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setAvatarFile(file);
                        }}
                      />
                      {state.errors?.image && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {state.errors.image[0]}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FiUser className="text-gray-500" />
                    <span>Full Name</span>
                  </label>
                  <div className="relative">
                    <input
                      name="name"
                      defaultValue={user.name}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      placeholder="John Doe"
                    />
                  </div>
                  {state.errors?.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {state.errors.name[0]}
                    </p>
                  )}
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <FiLock className="text-gray-500" />
                      <span>New Password</span>
                    </label>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Leave blank to keep current"
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                    {state.errors?.password && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {state.errors.password[0]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <FiLock className="text-gray-500" />
                      <span>Confirm Password</span>
                    </label>
                    <div className="relative">
                      <input
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re‑enter new password"
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                    {state.errors?.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {state.errors.confirmPassword[0]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-300"
                  >
                    Cancel
                  </button>
                  <SubmitButton
                    isPending={isPending}
                    label="Update Profile"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
