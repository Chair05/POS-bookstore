import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

export default function ManageStaff() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStaff = async () => {
    setLoading(true);
    setError("");

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    try {
      const res = await fetch("http://localhost:5000/api/admin/staff", {
        headers: {
          "x-user-role": user?.role || "",
        },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load staff members");
      }

      setStaff(data.staff || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const toggleAccess = async (id, allow) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    try {
      const res = await fetch(`http://localhost:5000/api/admin/staff/${id}/access`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
        },
        body: JSON.stringify({ allow }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Unable to update access");
      }

      setStaff((prev) =>
        prev.map((member) =>
          member.id === id
            ? { ...member, can_view_inventory_logs: allow ? 1 : 0 }
            : member
        )
      );
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading staff members...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
          <p className="text-red-600 font-semibold">{error}</p>
          <button
            onClick={loadStaff}
            className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <header className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 shadow">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-2xl relative -top-[7px]"
          >
            ☰
          </button>
          <h1 className="text-xl font-bold">Manage Staff Access</h1>
        </div>
        <button
          onClick={loadStaff}
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm"
        >
          Refresh
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold">Staff Members</h2>
              <p className="text-sm text-gray-500">
                Grant or remove Inventory Log access for staff accounts.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inventory Log Access
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {member.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {member.can_view_inventory_logs ? (
                        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                          Allowed
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                          Denied
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => toggleAccess(member.id, !member.can_view_inventory_logs)}
                        className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        {member.can_view_inventory_logs ? "Revoke" : "Grant"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
