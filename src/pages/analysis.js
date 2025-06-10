import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const Analysis = ({ user }) => {
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [dailyExpenses, setDailyExpenses] = useState([]);
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateChange = (e) => {
    setSelectedDate(new Date(e.target.value));
  };

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/net-income', {
          params: {
            user_id: user?.id,
            date: selectedDate.toISOString().split('T')[0],
          },
        });

        setRecentExpenses(response.data.recentExpenses || []);
        setPieChartData(response.data.pieChartData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    if (user?.id) fetchAnalysisData();
  }, [user, selectedDate]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-red-700 mb-6">Expense Analysis</h2>

      {/* 🆕 Recent Daily Expenses */}
      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-2">Recent Daily Expenses</h3>
        {recentExpenses.length === 0 ? (
          <p className="text-gray-500">No recent expenses found.</p>
        ) : (
          <table className="min-w-full bg-white shadow rounded">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-2 px-4">Date</th>
                <th className="py-2 px-4">Category</th>
                <th className="py-2 px-4">Amount</th>
                <th className="py-2 px-4">Description</th>
              </tr>
            </thead>
            <tbody>
              {recentExpenses.map((exp, index) => (
                <tr key={index} className="border-t">
                  <td className="py-2 px-4">
                    {exp.created_at
                      ? new Date(exp.created_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'N/A'}
                  </td>
                  <td className="py-2 px-4">{exp.category}</td>
                  <td className="py-2 px-4">₹{exp.amount}</td>
                  <td className="py-2 px-4">{exp.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 🥧 Pie Chart for Selected Date */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-4">Expense Breakdown</h3>

        <div className="mb-4">
          <label className="mr-2 font-medium">Select Date:</label>
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={handleDateChange}
            className="border p-1 rounded"
          />
        </div>

        {pieChartData.length === 0 ? (
          <p className="text-gray-500">No expense data for selected date.</p>
        ) : (
          <div className="max-w-md">
            <Pie
              data={{
                labels: pieChartData.map(item => item.category),
                datasets: [{
                  label: 'Amount',
                  data: pieChartData.map(item => item.totalAmount),
                  backgroundColor: ['#f87171', '#60a5fa', '#34d399', '#fbbf24'], // Customize as needed
                  borderWidth: 1,
                }]
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Analysis;
