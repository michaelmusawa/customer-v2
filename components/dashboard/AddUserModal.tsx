"use client";

import React, { useEffect, useState } from "react";
import { useActionState } from "react";
import { addUser, updateUser } from "@/app/lib/usersAction";
import SubmitButton from "../ui/SubmitButton";
import type { User, UserActionState } from "@/app/lib/definitions";
import {
  FiUser,
  FiMail,
  FiMapPin,
  FiClock,
  FiGrid,
  FiX,
  FiPlus,
  FiEdit2,
  FiChevronDown,
} from "react-icons/fi";

interface AddUserModalProps {
  role?: string;
  station?: string;
  user?: User;
}

export default function AddUserModal({
  role,
  station,
  user,
}: AddUserModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stations, setStations] = useState<string[]>([]);
  const [shifts, setShifts] = useState<string[]>([]);
  const [counters, setCounters] = useState<string[]>([]);
  const [selectedStation, setSelectedStation] = useState(
    station || user?.station || ""
  );
  const [selectedShift, setSelectedShift] = useState(user?.shift || "");
  const [selectedCounter, setSelectedCounter] = useState(user?.counter || "");

  const initialState: UserActionState = {
    message: null,
    state_error: null,
    errors: {},
  };
  const action = user ? updateUser : addUser;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    fetch("/api/settings/stations")
      .then((res) => res.json())
      .then((data) =>
        setStations(data.items.map((s: { id: number; name: string }) => s.name))
      );

    fetch("/api/settings/shifts")
      .then((res) => res.json())
      .then((data) =>
        setShifts(data.items.map((s: { id: number; name: string }) => s.name))
      );
  }, []);

  useEffect(() => {
    if (selectedStation && selectedShift) {
      fetch(
        `/api/availableCounters?station=${encodeURIComponent(
          selectedStation
        )}&shift=${encodeURIComponent(selectedShift)}`
      )
        .then((res) => res.json())
        .then((data) => {
          const availableCounters = data.counters || [];
          if (user?.counter && !availableCounters.includes(user.counter)) {
            setCounters([...availableCounters, user.counter]);
          } else {
            setCounters(availableCounters);
          }
        });
    }
  }, [selectedStation, selectedShift, user]);

  const open = () => {
    setIsOpen(true);
    setSelectedStation(station || user?.station || "");
    setSelectedShift(user?.shift || "");
    setSelectedCounter(user?.counter || "");
  };

  const close = () => {
    setIsOpen(false);
    setSelectedShift("");
    setSelectedCounter("");
    setCounters([]);
  };

  let title;

  if (role === "coordinator") {
    title = "Director";
  } else if (role === "supervisor") {
    title = "Supervisor";
  } else if (role === "biller") {
    title = "Biller";
  }

  return (
    <>
      <button
        onClick={open}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow transition-all hover:shadow-md
          
            bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white
        `}
      >
        {user ? (
          <FiEdit2 className="text-lg" />
        ) : (
          <FiPlus className="text-lg" />
        )}
        <span>{user ? `Edit ${title}` : `Add ${title}`}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {user ? (
                    <FiEdit2 className="text-yellow-500" />
                  ) : (
                    <FiPlus className="text-yellow-500" />
                  )}
                  <span>{user ? `Edit ${title}` : `Add ${title}`}</span>
                </h2>
                <button
                  onClick={close}
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
                <input type="hidden" name="role" defaultValue={role} />
                {user && <input type="hidden" name="userId" value={user.id} />}

                {/* Hidden station input for billers */}
                {role === "biller" && (
                  <input type="hidden" name="station" value={selectedStation} />
                )}

                {/* Name & Email */}
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <FiUser className="text-gray-500" />
                      <span>Full Name</span>
                    </label>
                    <div className="relative">
                      <input
                        name="name"
                        type="text"
                        required
                        defaultValue={user?.name || ""}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <FiMail className="text-gray-500" />
                      <span>Email Address</span>
                    </label>
                    <div className="relative">
                      <input
                        name="email"
                        type="email"
                        required
                        defaultValue={user?.email || ""}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="user@example.com"
                      />
                      {state.errors?.email && (
                        <p className="text-red-600 text-sm mt-1">
                          {state.errors.email[0]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Station (select) */}
                {role === "supervisor" && (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <FiMapPin className="text-gray-500" />
                      <span>Station</span>
                    </label>
                    <div className="relative">
                      <select
                        name="station"
                        value={selectedStation}
                        onChange={(e) => setSelectedStation(e.target.value)}
                        required
                        className="w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      >
                        <option value="">Select station</option>
                        {stations.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Shift and Counter for Billers */}
                {role === "biller" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <FiClock className="text-gray-500" />
                        <span>Shift</span>
                      </label>
                      <div className="relative">
                        <select
                          name="shift"
                          value={selectedShift}
                          onChange={(e) => setSelectedShift(e.target.value)}
                          required
                          className="w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        >
                          <option value="">Select shift</option>
                          {shifts.map((sh) => (
                            <option key={sh} value={sh}>
                              {sh}
                            </option>
                          ))}
                        </select>
                        <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                      </div>
                    </div>

                    {/* Counter (select) */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <FiGrid className="text-gray-500" />
                        <span>Counter</span>
                      </label>
                      <div className="relative">
                        <select
                          name="counter"
                          value={selectedCounter}
                          onChange={(e) => setSelectedCounter(e.target.value)}
                          required
                          className="w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                          disabled={!selectedStation || !selectedShift}
                        >
                          <option value="">Select counter</option>
                          {counters.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={close}
                    className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-300"
                  >
                    Cancel
                  </button>
                  <SubmitButton
                    isPending={isPending}
                    label={user ? "Update User" : "Create User"}
                    className={
                      "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    }
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
