import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Expense = ({ user }) => {
  const user_id = user?.id;

  const [income, setIncome] = useState('');
  const [isEditingIncome, setIsEditingIncome] = useState(false);

  const [fixedExpenses, setFixedExpenses] = useState({
    rent: '',
    electricity: '',
    water: '',
    internet: '',
    emi: '',
    others: ''
  });
  const [isEditingFixed, setIsEditingFixed] = useState(false);

  const [dailyExpense, setDailyExpense] = useState({
    amount: '',
    category: '',
    description: ''
  });

  // Fetch current income and fixed expenses on mount
  useEffect(() => {
    if (!user || !user.id) return; // prevent early run

    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/all-expenses?user_id=${user.id}`);
        const data = res.data;
        if (data) {
          setIncome(data.income || 0);
          setFixedExpenses({
            rent: data.rent || '',
            electricity: data.electricity || '',
            water: data.water || '',
            internet: data.internet || '',
            emi: data.emi || '',
            others: data.others || ''
          });
        }
      } catch (err) {
        console.error("Error fetching existing data", err);
      }
    };

    fetchData();
  }, [user]); // run every time user changes



  const handleIncomeSave = async () => {
  try {
    const res = await axios.post('http://localhost:5000/add-income', {
      user_id: user.id,
      amount: income
    });

    alert('Income updated!');
    setIsEditingIncome(false);

    // ✅ no need to reset income
    const refresh = await axios.get(`http://localhost:5000/all-expenses?user_id=${user.id}`);
    setIncome(refresh.data?.income || 0);
  } catch (error) {
    console.error("Income update failed:", error.response?.data || error.message);
    alert('Error updating income');
  }
};




  const handleFixedExpensesSave = async () => {
    try {
      await axios.post('http://localhost:5000/update-fixed-expenses', { user_id, ...fixedExpenses });
      alert('Fixed expenses updated!');
      setIsEditingFixed(false);
      const res = await axios.get(`http://localhost:5000/all-expenses?user_id=${user_id}`);
      const data = res.data;
      setFixedExpenses({
        rent: data.rent || '',
        electricity: data.electricity || '',
        water: data.water || '',
        internet: data.internet || '',
        emi: data.emi || '',
        others: data.others || ''
      });
    } catch (error) {
      console.error(error);
      alert('Error updating fixed expenses');
    }
  };


  const handleDailyExpenseSubmit = async () => {
    try {
      const { amount, category, description } = dailyExpense;
      await axios.post('http://localhost:5000/add-daily-expense', {
        user_id,
        amount,
        category,
        description
      });
      alert('Daily expense saved');
      setDailyExpense({ amount: '', category: '', description: '' });
    } catch (error) {
      console.error(error);
      alert('Error saving daily expense');
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Expense Log</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Income Section */}
        <div className="bg-white p-6 rounded-xl shadow-md w-full lg:w-1/3">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Income</h2>
          <input
  type="number"
  value={income}
  disabled={!isEditingIncome}
  onChange={(e) => setIncome(e.target.value)}
  className={`w-full border px-3 py-2 rounded-md mb-4 ${isEditingIncome ? 'border-gray-400' : 'bg-gray-100'}`}
/>

{isEditingIncome ? (
  <button onClick={handleIncomeSave} className="bg-red-600 text-white px-4 py-2 rounded-md w-full">
    Save Income
  </button>
) : (
  <button onClick={() => setIsEditingIncome(true)} className="bg-red-500 text-white px-4 py-2 rounded-md w-full">
    Edit Income
  </button>
)}

        </div>

        {/* Daily Expense Section */}
        <div className="bg-white p-6 rounded-xl shadow-md w-full lg:w-1/3">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Daily Expense</h2>
          <input
            type="number"
            placeholder="Amount"
            value={dailyExpense.amount}
            onChange={(e) => setDailyExpense({ ...dailyExpense, amount: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
          />
          <select
            value={dailyExpense.category}
            onChange={(e) => setDailyExpense({ ...dailyExpense, category: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
          >
            <option value="">Select category</option>
            <option value="food">Food</option>
            <option value="transport">Transport</option>
            <option value="shopping">Shopping</option>
            <option value="misc">Misc</option>
          </select>
          <textarea
            placeholder="Description (optional)"
            value={dailyExpense.description}
            onChange={(e) => setDailyExpense({ ...dailyExpense, description: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
          />
          <button
            onClick={handleDailyExpenseSubmit}
            className="bg-red-500 text-white px-4 py-2 rounded-md w-full"
          >
            Add Expense
          </button>
        </div>

        {/* Fixed Expenses Section */}
        <div className="bg-white p-6 rounded-xl shadow-md w-full lg:w-1/3">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Fixed Expenses</h2>
          {Object.entries(fixedExpenses).map(([key, value]) => (
            <div key={key} className="mb-4">
              <label className="block text-gray-700 mb-1 capitalize">{key}</label>
              <input
                type="number"
                value={value}
                disabled={!isEditingFixed}
                onChange={(e) =>
                  setFixedExpenses({ ...fixedExpenses, [key]: e.target.value })
                }
                className={`w-full border px-3 py-2 rounded-md ${isEditingFixed ? 'border-gray-400' : 'bg-gray-100'
                  }`}
              />
            </div>
          ))}
          {isEditingFixed ? (
            <button
              onClick={handleFixedExpensesSave}
              className="bg-red-600 text-white px-4 py-2 rounded-md w-full"
            >
              Save Fixed Expenses
            </button>
          ) : (
            <button
              onClick={() => setIsEditingFixed(true)}
              className="bg-red-500 text-white px-4 py-2 rounded-md w-full"
            >
              Edit Fixed Expenses
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Expense;
