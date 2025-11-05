import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactions } from '../services/api';

function TransactionLog({ user, onLogout }) {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', month: '' });

  useEffect(() => {
    loadTransactions();
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, [filters]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  const loadTransactions = async () => {
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.month) params.month = filters.month;
      
      const response = await transactions.getAll(params);
      setData(response.data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Month', 'Type', 'Category', 'Description', 'Amount (₹)'];
    const rows = data.map(t => [
      t.month,
      t.type,
      t.category || '',
      t.description,
      t.amount
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
  };

  const getTypeColor = (type) => {
    if (darkMode) {
      const colors = {
        income: 'text-green-400 bg-green-900/30',
        expense: 'text-red-400 bg-red-900/30',
        loan_payment: 'text-orange-400 bg-orange-900/30',
        investment_gain: 'text-blue-400 bg-blue-900/30',
        investment_contribution: 'text-purple-400 bg-purple-900/30',
        lump_sum: 'text-gray-400 bg-gray-700'
      };
      return colors[type] || 'text-gray-400 bg-gray-700';
    } else {
      const colors = {
        income: 'text-green-600 bg-green-50',
        expense: 'text-red-600 bg-red-50',
        loan_payment: 'text-orange-600 bg-orange-50',
        investment_gain: 'text-blue-600 bg-blue-50',
        investment_contribution: 'text-purple-600 bg-purple-50',
        lump_sum: 'text-gray-600 bg-gray-50'
      };
      return colors[type] || 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className={`text-xl font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Loading...</div>
    </div>;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <nav className={`shadow-lg border-b-4 ${darkMode ? 'bg-gray-800 border-indigo-400' : 'bg-white border-indigo-500'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent'}`}>
                📊 Transaction Log
              </h1>
              {user && (
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Hi, <span className={`font-semibold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{user.name}</span> 👋
                </p>
              )}
            </div>
            <div className="flex gap-3 items-center">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`px-4 py-2 rounded-lg font-semibold shadow-md transition-all ${
                  darkMode 
                    ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500' 
                    : 'bg-gray-700 text-white hover:bg-gray-800'
                }`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md transition-all"
              >
                Dashboard
              </button>
              <button 
                onClick={() => navigate('/transactions')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-md transition-all"
              >
                Transactions
              </button>
              <button 
                onClick={() => navigate('/scenarios')}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold shadow-md transition-all"
              >
                Scenarios
              </button>
              <button 
                onClick={onLogout}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow-md transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className={`rounded-lg shadow p-4 mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex gap-4 items-center flex-wrap">
            <div>
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-200' : ''}`}>Filter by Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className={`px-4 py-2 border-2 rounded-lg ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-300'
                }`}
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="loan_payment">Loan Payment</option>
                <option value="investment_gain">Investment Gain</option>
                <option value="investment_contribution">Investment Contribution</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-200' : ''}`}>Filter by Month</label>
              <input
                type="number"
                placeholder="Any month"
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                className={`px-4 py-2 border-2 rounded-lg w-32 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-300'
                }`}
              />
            </div>

            <button
              onClick={() => setFilters({ type: '', month: '' })}
              className="mt-7 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold shadow-md"
            >
              Clear Filters
            </button>

            <button
              onClick={exportToCSV}
              className="mt-7 px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-semibold shadow-md"
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        <div className={`rounded-lg shadow overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gradient-to-r from-indigo-600 to-blue-600'}>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Month</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Description</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-white">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="5" className={`px-6 py-12 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="text-6xl mb-4">📭</div>
                      <div className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : ''}`}>No transactions found</div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : ''}`}>Run a simulation first to see transactions</div>
                    </td>
                  </tr>
                ) : (
                  data.map((transaction) => (
                    <tr key={transaction.id} className={`transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <td className={`px-6 py-4 text-sm font-semibold ${darkMode ? 'text-gray-200' : ''}`}>{transaction.month}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full font-semibold ${getTypeColor(transaction.type)}`}>
                          {transaction.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : ''}`}>{transaction.category || '-'}</td>
                      <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : ''}`}>{transaction.description}</td>
                      <td className={`px-6 py-4 text-sm text-right font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        ₹{parseFloat(transaction.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`mt-6 rounded-xl shadow-lg p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center">
            <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Total Transactions: <span className={darkMode ? 'text-indigo-400' : 'text-indigo-600'}>{data.length}</span>
            </span>
            <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Total Amount: <span className={darkMode ? 'text-indigo-400' : 'text-indigo-600'}>₹{data.reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransactionLog;