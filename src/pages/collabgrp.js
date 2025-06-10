import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { GiNinjaHead } from "react-icons/gi";
import { FaMoneyBillWave } from "react-icons/fa";
import { GiReceiveMoney } from "react-icons/gi";




const CollabGroup = () => {
  const { code } = useParams();
  const location = useLocation();
  const usernameFromState = location.state?.username || "";
  const [netIncome, setNetIncome] = useState(0);




  const [groupTitle, setGroupTitle] = useState("");
  const [form, setForm] = useState({
    username: "",
    category: "",
    description: "",
    price: "",
  });
  const [expenses, setExpenses] = useState([]);
  const navigate = useNavigate();
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/get-collab-group/${code}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setGroupTitle(data.group_title);
          const baseIncome = parseFloat(data.group_income);

          const savedExpenses = JSON.parse(localStorage.getItem(`collabExpenses_${code}`) || "[]");
          const filteredExpenses = savedExpenses.filter(e => e.category !== "Income");

          const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.price || 0), 0);
          setNetIncome(baseIncome - totalExpenses);

          const alreadyAdded = savedExpenses.some(e => e.category === "Income");

          if (!alreadyAdded) {
            const incomeEntry = {
              username: usernameFromState,
              category: "Income",
              description: "Initial group income",
              price: baseIncome,
            };

            const updatedExpenses = [incomeEntry, ...savedExpenses];
            localStorage.setItem(`collabExpenses_${code}`, JSON.stringify(updatedExpenses));
            setExpenses([incomeEntry, ...filteredExpenses]);
          } else {
            setExpenses(savedExpenses);
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching group details:", err);
      });

    if (usernameFromState) {
      setForm((prev) => ({
        ...prev,
        username: usernameFromState,
      }));
    }

    const fetchMessages = () => {
      fetch(`http://localhost:5000/get-messages/${code}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setChatMessages(data);
          } else {
            console.error("Invalid messages format:", data);
            setChatMessages([]); // fallback to empty
          }
        })
        .catch(err => {
          console.error("Error fetching messages:", err);
          setChatMessages([]); // on error, empty array to avoid .map crash
        });
    };


    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);

  }, [code, usernameFromState]);

  useEffect(() => {
    const baseIncome = expenses.find(e => e.category === "Income")?.price || 0;
    const totalSpent = expenses
      .filter(e => e.category !== "Income")
      .reduce((sum, e) => sum + parseFloat(e.price || 0), 0);
    setNetIncome(baseIncome - totalSpent);
  }, [expenses]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddExpense = () => {
    const newExpense = { ...form, price: parseFloat(form.price) };
    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    localStorage.setItem(`collabExpenses_${code}`, JSON.stringify(updatedExpenses));
    setForm({ ...form, category: "", description: "", price: "" });
  };

  const sendMessage = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    fetch("http://localhost:5000/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        groupCode: code,
        username: form.username,
        message: newMessage,
      }),
    }).then(() => {
      setNewMessage("");
    });
  };


  // 🧠 Badge Calculation
  const memberStats = {};

  expenses.forEach((e) => {
    if (e.category === "Income") return; // Skip income
    if (!memberStats[e.username]) {
      memberStats[e.username] = { total: 0, count: 0 };
    }
    memberStats[e.username].total += parseFloat(e.price);
    memberStats[e.username].count += 1;
  });

  // 🏆 Find Badges
  let lowestSpender = null;
  let highestSpender = null;
  let mostTransactions = null;

  Object.entries(memberStats).forEach(([username, stats]) => {
    if (
      !lowestSpender ||
      stats.total < memberStats[lowestSpender].total
    ) {
      lowestSpender = username;
    }
    if (
      !highestSpender ||
      stats.total > memberStats[highestSpender].total
    ) {
      highestSpender = username;
    }
    if (
      !mostTransactions ||
      stats.count > memberStats[mostTransactions].count
    ) {
      mostTransactions = username;
    }
  });

  const badgeMap = {}; // username => array of badges

  if (lowestSpender) {
    badgeMap[lowestSpender] = badgeMap[lowestSpender] || [];
    badgeMap[lowestSpender].push({
      icon: <GiReceiveMoney className="text-yellow-500" />,
      label: "Frugal Friend: Lowest total spent"
    });
  }

  if (highestSpender) {
    badgeMap[highestSpender] = badgeMap[highestSpender] || [];
    badgeMap[highestSpender].push({
      icon: <FaMoneyBillWave className="text-green-500" />,
      label: "Big Spender: Highest total spent"
    });
  }

  if (mostTransactions) {
    badgeMap[mostTransactions] = badgeMap[mostTransactions] || [];
    badgeMap[mostTransactions].push({
      icon: <GiNinjaHead className="text-black-100" />,
      label: "Expense Ninja: Most transactions done!"
    });
  }




  return (
    <div className="container mx-auto mt-10 px-4">
      <button
        onClick={() => navigate("/my-groups")}
        className="mb-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
      >
        ←
      </button>

      <h1 className="text-3xl font-bold mb-6">

        Group: {groupTitle}{" "}
        <span className="text-lg font-medium text-green-600">
          (Net Income: ₹{netIncome})
        </span>
      </h1>

      <div className="bg-white p-6 rounded shadow-md">
        <h2 className="text-xl font-semibold mb-4">Add Expense</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="username"
            value={form.username}
            disabled
            className="border p-2 rounded bg-gray-100 cursor-not-allowed"
          />
          <input
            type="text"
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="Category"
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="border p-2 rounded"
          />
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Amount"
            className="border p-2 rounded"
          />
        </div>
        <button
          onClick={handleAddExpense}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Expense
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Expenses</h2>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Username</th>
              <th className="py-2 px-4 border-b">Category</th>
              <th className="py-2 px-4 border-b">Description</th>
              <th className="py-2 px-4 border-b">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center text-gray-500 py-4">
                  No expenses yet
                </td>
              </tr>
            ) : (
              expenses.map((e, index) => (
                <tr key={index} className="text-center">
                  <td className="border px-4 py-2">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-red-800 font-medium">{e.username}</span>
                      {badgeMap[e.username] && badgeMap[e.username].map((badge, idx) => (
                        <div key={idx} className="relative group inline-block align-middle">
                          <span className="text-lg leading-none animate-pulse hover:animate-none transition-transform duration-200">
                            {badge.icon}
                          </span>

                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow z-50">
                            {badge.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>




                  <td className="border px-4 py-2">{e.category}</td>
                  <td className="border px-4 py-2">{e.description}</td>
                  <td className="border px-4 py-2">{e.price}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mt-10 bg-white p-4 rounded shadow-md">
          <h2 className="text-xl font-semibold mb-4">Group Chat</h2>

          <div className="max-h-64 overflow-y-auto mb-4 border p-3 rounded bg-gray-50">
            {chatMessages.length === 0 ? (
              <p className="text-gray-400">No messages yet</p>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className="mb-2">
                  <span className="font-bold text-red-600">{msg.username}</span>: {" "}
                  <span>{msg.message}</span>
                  <div className="text-xs text-gray-400">
                    {new Date(msg.sent_at).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border p-2 rounded"
            />
            <button
              onClick={sendMessage}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Send
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CollabGroup;
