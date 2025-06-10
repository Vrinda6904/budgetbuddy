import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa";


const MyGroups = () => {
  const [createdGroups, setCreatedGroups] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const [createdRes, joinedRes] = await Promise.all([
          fetch(`http://localhost:5000/api/groups/${user.id}`),
          fetch(`http://localhost:5000/api/joined-groups/${user.id}`)
        ]);

        const created = await createdRes.json();
        const joined = await joinedRes.json();

        setCreatedGroups(created);
        setJoinedGroups(joined);
      } catch (err) {
        console.error("Error fetching groups:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchGroups();
  }, [user?.id]);

  if (loading) return <p>Loading your groups...</p>;

  const viewGroup = (groupCode) => {
    const username = user.name || "Guest"; // fallback
    navigate(`/collabgrp/${groupCode}`, {
      state: { username }
    });
  };

  const deleteGroup = async (groupCode) => {
  if (!window.confirm("Are you sure you want to delete this group?")) return;

  try {
    const res = await fetch(`http://localhost:5000/api/groups/${groupCode}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (res.ok) {
      alert("Group deleted!");
      setCreatedGroups(createdGroups.filter(g => g.group_code !== groupCode));
    } else {
      alert(data.error || "Failed to delete group");
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Server error");
  }
};


  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <button
        onClick={() => navigate("/collaborate")}
        className="mb-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
      >
        ←
      </button>

      <h1 className="text-2xl font-bold mb-4">My Created Groups</h1>
{createdGroups.length === 0 ? (
  <p className="text-gray-600">You haven't created any groups yet.</p>
) : (
  <table className="min-w-full border mb-10">
    <thead>
      <tr className="bg-gray-100">
        <th className="py-2 px-4 border">Group Name</th>
        <th className="py-2 px-4 border">Group Code</th>
        <th className="py-2 px-4 border"></th>
        <th className="py-2 px-4 border text-red-500">Delete</th>
      </tr>
    </thead>
    <tbody>
      {createdGroups.map((g) => (
        <tr key={g.group_code}>
          <td className="border px-4 py-2">{g.group_title}</td>
          <td className="border px-4 py-2 font-mono">{g.group_code}</td>
          <td className="border px-4 py-2 text-center">
  <button
    onClick={() => viewGroup(g.group_code)}
    className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
  >
    View
  </button>
</td>
<td className="border px-4 py-2 text-center">
  <button
    onClick={() => deleteGroup(g.group_code)}
    className="text-red-600 hover:text-red-800"
    title="Delete Group"
  >
    <FaTrash className="inline-block" />
  </button>
</td>


        </tr>
      ))}
    </tbody>
  </table>
)}


      <h2 className="text-xl font-bold mb-4">Joined Groups</h2>
      {joinedGroups.length === 0 ? (
        <p className="text-gray-600">You haven't joined any other groups yet.</p>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border">Group Name</th>
              <th className="py-2 px-4 border">Group Code</th>
              <th className="py-2 px-4 border"></th>
            </tr>
          </thead>
          <tbody>
            {joinedGroups.map((g) => (
              <tr key={g.group_code}>
                <td className="border px-4 py-2">{g.group_title}</td>
                <td className="border px-4 py-2 font-mono">{g.group_code}</td>
                <td className="border px-4 py-2 text-center">
                  <button
                    onClick={() => viewGroup(g.group_code)}
                    className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyGroups;
