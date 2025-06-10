import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {Link } from "react-router-dom";


const generateGroupCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const CollaborativeBudgeting = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [joinUsername, setJoinUsername] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const [groupTitle, setGroupTitle] = useState("");
  const [groupIncome, setGroupIncome] = useState("");
  const [groupCode, setGroupCode] = useState(generateGroupCode());
  const [numMembers, setNumMembers] = useState("");
  const navigate = useNavigate();

 const handleJoinGroup = async (e) => {
  e.preventDefault();

  const user = JSON.parse(localStorage.getItem("user")); // get user from localStorage

  try {
    const res = await fetch("http://localhost:5000/join-collab-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, groupCode: joinCode }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to join group");
      return;
    }

    // Success
    navigate(`/collabgrp/${joinCode}`, {
      state: { username: joinUsername },
    });
  } catch (err) {
    console.error("Error joining group:", err);
    alert("Server error");
  }
};


  const handleCreateGroup = async (e) => {
    e.preventDefault();

    const groupData = {
      group_title: groupTitle,
      group_income: groupIncome,
      group_code: groupCode,
      num_members: numMembers,
    };
    

    try {
      const res = await fetch("http://localhost:5000/create-collab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ Add this line
        body: JSON.stringify(groupData),
      });

      if (res.ok) {
        alert(`Group Created!\nTitle: ${groupTitle}`);
        setIsCreating(false);
        setGroupTitle("");
        setGroupIncome("");
        setGroupCode(generateGroupCode());
        setNumMembers("");
        navigate(`/collabgrp/${groupCode}`, {
          state: { username: joinUsername },
        });
      } else {
        alert("Failed to create group");
      }
    } catch (err) {
      console.error("Error creating group:", err);
      alert("Server error");
    }
  };

  return (
    <div className="bg-yellow-50 flex justify-center items-center px-4">

      <div className="bg-white p-10 rounded shadow-md w-full max-w-md">
      <div className="flex justify-end mb-4">
  <Link
    to="/my-groups"
    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition text-sm"
  >
    My Groups
  </Link>
</div>

        {!isCreating ? (
          <>
            <h2 className="text-2xl font-semibold text-center mb-6">Collaborative Budgeting</h2>
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={joinUsername}
                onChange={(e) => setJoinUsername(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Group Code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
                required
              />
              <button
                type="submit"
                className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
              >
                Join Group
              </button>
            </form>
            <p className="text-center mt-4">
              Don’t have a group?{" "}
              <button
                onClick={() => setIsCreating(true)}
                className="text-red-600 font-medium hover:underline"
              >
                Create one now
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-center mb-6">Create a Group</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <input
                type="text"
                placeholder="Group Title"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
                required
              />
              <input
                type="number"
                placeholder="Group Income"
                value={groupIncome}
                onChange={(e) => setGroupIncome(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Your Username"
                value={joinUsername}
                onChange={(e) => setJoinUsername(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
                required
              />
              <input
                type="text"
                value={groupCode}
                readOnly
                className="w-full border border-gray-300 p-2 rounded bg-gray-100 cursor-not-allowed"
              />
              <input
                type="number"
                placeholder="Number of Members"
                value={numMembers}
                onChange={(e) => setNumMembers(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
                required
              />
              <button
                type="submit"
                className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
              >
                Create Group
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="w-full text-sm text-gray-600 hover:underline mt-2"
              >
                ← Back to Join Group
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default CollaborativeBudgeting;
