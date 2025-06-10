import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <p className="text-lg text-gray-700 mb-8">
        Take control of your finances and track your expenses with ease.
      </p>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 gap-6 max-w-3xl">
        <Link to="/expense" className="block">
          <div className="p-6 border rounded-lg bg-white shadow hover:shadow-lg transition">
            <h3 className="text-xl font-bold mb-2">Expense Log</h3>
            <p>Register your expenses and insights</p>
          </div>
        </Link>

        <Link to="/budgets" className="block">
          <div className="p-6 border rounded-lg bg-white shadow hover:shadow-lg transition">
            <h3 className="text-xl font-bold mb-2">Set Budgets</h3>
            <p>Define your budget limits</p>
          </div>
        </Link>

        <Link to="/analysis" className="block">
          <div className="p-6 border rounded-lg bg-white shadow hover:shadow-lg transition">
            <h3 className="text-xl font-bold mb-2">Expense Analysis</h3>
            <p>Review your spending history</p>
          </div>
        </Link>

        <Link to="/collaborate" className="block">
          <div className="p-6 border rounded-lg bg-white shadow hover:shadow-lg transition">
            <h3 className="text-xl font-bold mb-2">Collaborative Budgeting</h3>
            <p>Manage budgets with others</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default Home;
