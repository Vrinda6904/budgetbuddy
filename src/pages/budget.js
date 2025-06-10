import { useState, useEffect } from 'react';
import axios from 'axios';

function Budget({ user }) {
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState('');
  const [period, setPeriod] = useState('months');
  const [netIncome, setNetIncome] = useState(0); // Will be fetched from backend

  // Fetch net income from API
  useEffect(() => {
    const fetchNetIncome = async () => {
      try {
        const response = await axios.get('http://localhost:5000/net-income', {
          params: { user_id: user?.id },
        });
        setNetIncome(response.data.netIncome);
      } catch (error) {
        console.error('Error fetching net income:', error);
      }
    };

    if (user?.id) fetchNetIncome();
  }, [user]);

  const getDurationInMonths = () => {
    switch (period) {
      case 'weeks':
        return duration / 4.345;
      case 'months':
        return duration;
      case 'years':
        return duration * 12;
      default:
        return 1;
    }
  };

  const monthlySaving = goal && duration ? goal / getDurationInMonths() : 0;

  return (
    <div className="space-y-10">
      <h2 className="text-3xl font-bold text-red-700">Set Your Budget Goal</h2>

      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-2xl">
        <div className="mb-4">
          <label className="block font-medium mb-1">Saving Goal (₹)</label>
          <input
            type="number"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Enter your target amount"
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Duration</label>
          <div className="flex space-x-4">
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 6"
              className="w-1/2 px-4 py-2 border border-gray-300 rounded-md"
            />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-1/2 px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-gray-800 font-semibold">
          <p>Net Income: ₹{netIncome}</p>
          {goal && duration ? (
            <>
              {period !== 'weeks' && (
                <p> You need to save ₹{monthlySaving.toFixed(2)} per month</p>
              )}
              {(period === 'weeks' || period === 'years' || period === 'months') && (
                <p> Weekly: ₹{(monthlySaving / 4.345).toFixed(2)} | Daily: ₹{(monthlySaving / 30.44).toFixed(2)}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">Enter goal and duration to see breakdown</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Budget;
