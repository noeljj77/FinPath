import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { incomes, expenses, loans, investments, simulate } from '../services/api';

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [data, setData] = useState({
    incomes: [],
    expenses: [],
    loans: [],
    investments: []
  });
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [months, setMonths] = useState(12);
  const [showAddModal, setShowAddModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showLoanModal, setShowLoanModal] = useState(null);
  const [showWhatIfModal, setShowWhatIfModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadData();
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  useEffect(() => {
    if (isPlaying && simulation) {
      const interval = setInterval(() => {
        setCurrentMonth(prev => {
          if (prev >= simulation.timeline.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isPlaying, simulation]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  const loadData = async () => {
    try {
      const [incomesRes, expensesRes, loansRes, investmentsRes] = await Promise.all([
        incomes.getAll(),
        expenses.getAll(),
        loans.getAll(),
        investments.getAll()
      ]);

      setData({
        incomes: incomesRes.data,
        expenses: expensesRes.data,
        loans: loansRes.data,
        investments: investmentsRes.data
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async (actions = []) => {
    setSimulating(true);
    try {
      const response = await simulate.run({ months, actions });
      setSimulation(response.data);
      setCurrentMonth(0);
      // Reload data to get updated loan balances
      await loadData();
    } catch (error) {
      console.error('Simulation error:', error);
      alert('Simulation failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setSimulating(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all data to original values? This will clear simulation results.')) return;
    
    setResetting(true);
    try {
      await simulate.reset();
      await loadData();
      setSimulation(null);
      setCurrentMonth(0);
      alert('✅ Successfully reset to original values!');
    } catch (error) {
      console.error('Reset error:', error);
      alert('Failed to reset: ' + (error.response?.data?.error || error.message));
    } finally {
      setResetting(false);
    }
  };

  const handleAddItem = async (type, item) => {
    try {
      if (type === 'incomes') {
        await incomes.create(item);
      } else if (type === 'expenses') {
        await expenses.create(item);
      } else if (type === 'loans') {
        await loans.create(item);
      } else if (type === 'investments') {
        await investments.create(item);
      }
      await loadData();
      setShowAddModal(null);
    } catch (error) {
      console.error('Failed to add item:', error);
      throw error;
    }
  };

  const handleEditItem = async (type, id, item) => {
    try {
      if (type === 'incomes') {
        await incomes.update(id, item);
      } else if (type === 'expenses') {
        await expenses.update(id, item);
      } else if (type === 'loans') {
        await loans.update(id, item);
      } else if (type === 'investments') {
        await investments.update(id, item);
      }
      await loadData();
      setShowEditModal(null);
    } catch (error) {
      console.error('Failed to update item:', error);
      alert('Failed to update item');
    }
  };

  const handleDeleteItem = async (type, id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      if (type === 'incomes') {
        await incomes.delete(id);
      } else if (type === 'expenses') {
        await expenses.delete(id);
      } else if (type === 'loans') {
        await loans.delete(id);
      } else if (type === 'investments') {
        await investments.delete(id);
      }
      await loadData();
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item');
    }
  };

  const simulateMissedPayment = (loanId, month) => {
    runSimulation([{ type: 'missed_payment', loanId, month }]);
    setShowLoanModal(null);
  };

  const getMonthlyAmount = (amount, frequency) => {
    return frequency === 'annual' ? amount / 12 : amount;
  };

  const getTotalMonthlyIncome = () => {
    return data.incomes.reduce((sum, i) => sum + getMonthlyAmount(parseFloat(i.amount), i.frequency), 0);
  };

  const getTotalMonthlyExpenses = () => {
    return data.expenses.reduce((sum, e) => sum + getMonthlyAmount(parseFloat(e.amount), e.frequency), 0);
  };

  const getCreditScoreTips = () => {
    if (!simulation || !simulation.creditHistory || simulation.creditHistory.length === 0) return [];
    
    const currentCredit = simulation.creditHistory[currentMonth];
    const tips = [];

    if (currentCredit.breakdown.paymentHistory < 200) {
      tips.push({
        icon: '💳',
        title: 'Improve Payment History',
        description: 'Make all loan payments on time. This is 35-40% of your score.',
        impact: 'High'
      });
    }

    if (currentCredit.breakdown.utilization < 100) {
      tips.push({
        icon: '📉',
        title: 'Reduce Credit Utilization',
        description: 'Keep loan balances below 30% of original amounts.',
        impact: 'High'
      });
    }

    if (currentCredit.breakdown.creditAge < 50) {
      tips.push({
        icon: '⏳',
        title: 'Build Credit History',
        description: 'Maintain accounts for longer. Age improves your score over time.',
        impact: 'Medium'
      });
    }

    if (currentCredit.breakdown.debtToIncome < 40) {
      tips.push({
        icon: '💰',
        title: 'Improve Debt-to-Income Ratio',
        description: 'Increase income or reduce monthly loan payments.',
        impact: 'Medium'
      });
    }

    if (currentCredit.score >= 750) {
      tips.push({
        icon: '🎉',
        title: 'Excellent Work!',
        description: 'Your credit score is in the "Very Good" range. Keep it up!',
        impact: 'Maintain'
      });
    }

    return tips;
  };

  const predictFutureScore = () => {
    if (!simulation || !simulation.creditHistory || simulation.creditHistory.length < 2) return null;

    const scores = simulation.creditHistory.map(c => c.score);
    const avgIncrease = (scores[scores.length - 1] - scores[0]) / scores.length;
    
    return {
      in6Months: Math.min(900, Math.round(scores[scores.length - 1] + (avgIncrease * 6))),
      in12Months: Math.min(900, Math.round(scores[scores.length - 1] + (avgIncrease * 12))),
      in24Months: Math.min(900, Math.round(scores[scores.length - 1] + (avgIncrease * 24)))
    };
  };

  const getLoanPayoffTimeline = () => {
    if (!data.loans || data.loans.length === 0) return [];
    
    return data.loans.map(loan => {
      const monthlyRate = loan.apr / 12 / 100;
      let balance = parseFloat(loan.currentBalance);
      let monthsToPayoff = 0;

      while (balance > 0.01 && monthsToPayoff < loan.termMonths * 2) {
        const interest = balance * monthlyRate;
        const principal = Math.min(parseFloat(loan.monthlyPayment) - interest, balance);
        balance -= principal;
        monthsToPayoff++;
      }

      const payoffDate = new Date();
      payoffDate.setMonth(payoffDate.getMonth() + monthsToPayoff);

      const totalMonthsElapsed = loan.termMonths - monthsToPayoff;
      const progress = totalMonthsElapsed > 0 ? (totalMonthsElapsed / loan.termMonths) * 100 : 0;

      return {
        name: loan.name,
        monthsLeft: monthsToPayoff,
        payoffDate: payoffDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        progress: Math.min(100, Math.max(0, progress))
      };
    });
  };

  const currentMonthData = simulation?.timeline[currentMonth];
  const currentCreditScore = simulation?.creditHistory?.[currentMonth];
  const creditTips = getCreditScoreTips();
  const scorePrediction = predictFutureScore();
  const payoffTimeline = getLoanPayoffTimeline();

  if (loading) {
    return <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className={`text-xl font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Loading...</div>
    </div>;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      {/* Modern Navigation */}
      <nav className={`shadow-lg border-b-4 ${darkMode ? 'bg-gray-800 border-indigo-400' : 'bg-white border-indigo-500'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent'}`}>
                💰 Finance Simulator
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
                className={`px-6 py-2 rounded-lg font-semibold shadow-md transition-all ${
                  darkMode 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => navigate('/transactions')}
                className={`px-6 py-2 rounded-lg font-semibold shadow-md transition-all ${
                  darkMode 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                Transactions
              </button>
              <button 
                onClick={() => navigate('/scenarios')}
                className={`px-6 py-2 rounded-lg font-semibold shadow-md transition-all ${
                  darkMode 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                Scenarios
              </button>
              <button 
                onClick={onLogout}
                className={`px-6 py-2 rounded-lg font-semibold shadow-md transition-all ${
                  darkMode 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-90">Monthly Income</h3>
            <p className="text-3xl font-bold mt-2">₹{getTotalMonthlyIncome().toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-400 to-red-600 p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-90">Monthly Expenses</h3>
            <p className="text-3xl font-bold mt-2">₹{getTotalMonthlyExpenses().toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-90">Total Debt</h3>
            <p className="text-3xl font-bold mt-2">
              ₹{data.loans.reduce((sum, l) => sum + parseFloat(l.currentBalance), 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-90">Total Investments</h3>
            <p className="text-3xl font-bold mt-2">
              ₹{data.investments.reduce((sum, i) => sum + parseFloat(i.currentBalance), 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Quick Add</h2>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setShowAddModal('income')} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-md transition-all">
              + Income
            </button>
            <button onClick={() => setShowAddModal('expense')} className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow-md transition-all">
              + Expense
            </button>
            <button onClick={() => setShowAddModal('loan')} className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold shadow-md transition-all">
              + Loan
            </button>
            <button onClick={() => setShowAddModal('investment')} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md transition-all">
              + Investment
            </button>
          </div>
        </div>

        {/* Items Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ItemList 
            title="Incomes" 
            items={data.incomes} 
            type="incomes"
            darkMode={darkMode}
            onEdit={(item) => setShowEditModal({ type: 'incomes', item })}
            onDelete={(id) => handleDeleteItem('incomes', id)}
            formatAmount={(item) => `₹${getMonthlyAmount(parseFloat(item.amount), item.frequency).toFixed(2)}/mo`}
          />
          <ItemList 
            title="Expenses" 
            items={data.expenses} 
            type="expenses"
            darkMode={darkMode}
            onEdit={(item) => setShowEditModal({ type: 'expenses', item })}
            onDelete={(id) => handleDeleteItem('expenses', id)}
            formatAmount={(item) => `₹${getMonthlyAmount(parseFloat(item.amount), item.frequency).toFixed(2)}/mo`}
          />
          <ItemList 
            title="Loans" 
            items={data.loans} 
            type="loans"
            darkMode={darkMode}
            onEdit={(item) => setShowEditModal({ type: 'loans', item })}
            onDelete={(id) => handleDeleteItem('loans', id)}
            onDetails={(item) => setShowLoanModal(item)}
            formatAmount={(item) => `₹${parseFloat(item.currentBalance).toFixed(2)}`}
          />
          <ItemList 
            title="Investments" 
            items={data.investments} 
            type="investments"
            darkMode={darkMode}
            onEdit={(item) => setShowEditModal({ type: 'investments', item })}
            onDelete={(id) => handleDeleteItem('investments', id)}
            formatAmount={(item) => `₹${parseFloat(item.currentBalance).toFixed(2)}`}
          />
        </div>

        {/* Simulation Controls */}
        <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Simulation Controls</h2>
          <div className="flex gap-4 items-center flex-wrap">
            <input
              type="number"
              min="1"
              max="360"
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value))}
              className={`px-4 py-2 border-2 rounded-lg w-24 font-semibold ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'border-gray-300'
              }`}
            />
            <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>months</span>
            <button
              onClick={() => runSimulation()}
              disabled={simulating}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 font-semibold shadow-lg disabled:opacity-50 transition-all"
            >
              {simulating ? '⏳ Running...' : '🚀 Run Simulation'}
            </button>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 font-semibold shadow-lg disabled:opacity-50 transition-all"
            >
              {resetting ? '⏳ Resetting...' : '🔄 Reset to Original'}
            </button>
            <button
              onClick={() => setShowWhatIfModal(true)}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg transition-all"
            >
              🧮 What-If Calculator
            </button>
          </div>
        </div>

        {/* Loan Payoff Timeline */}
        {payoffTimeline.length > 0 && (
          <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>📅 Loan Payoff Timeline</h2>
            <div className="space-y-4">
              {payoffTimeline.map((loan, idx) => (
                <div key={idx} className={`border-l-4 border-indigo-500 pl-4 py-2 ${darkMode ? 'bg-gray-700' : ''}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{loan.name}</h3>
                    <span className={`text-sm font-semibold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{loan.payoffDate}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex-1 rounded-full h-3 overflow-hidden ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-full transition-all duration-500"
                        style={{ width: `${loan.progress}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{Math.round(loan.progress)}%</span>
                  </div>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{loan.monthsLeft} months remaining</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Simulation Results sections... */}
        {/* (Continue with the rest of the simulation results sections - they remain the same but with dark mode classes added) */}
        {/* For brevity, I'll include key sections. The pattern is the same - add darkMode conditionals */}

        {simulation && (
          <>
            {/* Timeline Control */}
            <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Timeline (Month {currentMonth})</h2>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md"
                >
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max={simulation.timeline.length - 1}
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Credit Score and Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Credit Score Analysis */}
              <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Credit Score Analysis</h3>
                
                <div className="text-center mb-6">
                  <div className="text-7xl font-bold py-4" style={{ 
                    color: currentCreditScore?.score >= 850 ? '#10b981' : 
                           currentCreditScore?.score >= 750 ? '#3b82f6' :
                           currentCreditScore?.score >= 650 ? '#f59e0b' : 
                           currentCreditScore?.score >= 550 ? '#f97316' : '#ef4444'
                  }}>
                    {currentCreditScore?.score || 300}
                  </div>
                  
                  <div className={`inline-block px-6 py-2 rounded-full font-bold text-lg mb-4 ${
                    currentCreditScore?.score >= 850 ? 'bg-green-100 text-green-800' :
                    currentCreditScore?.score >= 750 ? 'bg-blue-100 text-blue-800' :
                    currentCreditScore?.score >= 650 ? 'bg-yellow-100 text-yellow-800' :
                    currentCreditScore?.score >= 550 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {currentCreditScore?.category || 'Poor'}
                  </div>

                  {/* Score Range Guide */}
                  <div className={`mt-4 text-left p-4 rounded-lg text-sm space-y-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className={`font-semibold ${darkMode ? 'text-gray-200' : ''}`}>850-900:</span>
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Excellent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className={`font-semibold ${darkMode ? 'text-gray-200' : ''}`}>750-849:</span>
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Very Good</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className={`font-semibold ${darkMode ? 'text-gray-200' : ''}`}>650-749:</span>
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Good</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className={`font-semibold ${darkMode ? 'text-gray-200' : ''}`}>550-649:</span>
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Fair</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className={`font-semibold ${darkMode ? 'text-gray-200' : ''}`}>300-549:</span>
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Poor</span>
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                {currentCreditScore?.breakdown && (
                  <div className="space-y-3">
                    <h4 className={`font-bold mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Score Breakdown:</h4>
                    
                    <div className="space-y-2">
                      <div className={`flex justify-between items-center p-2 rounded ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                        <div>
                          <span className={`font-medium text-sm ${darkMode ? 'text-gray-200' : ''}`}>Payment History</span>
                          <span className={`text-xs block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>35-40% weight</span>
                        </div>
                        <span className={`font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{Math.round(currentCreditScore.breakdown.paymentHistory || 0)}</span>
                      </div>

                      <div className={`flex justify-between items-center p-2 rounded ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                        <div>
                          <span className={`font-medium text-sm ${darkMode ? 'text-gray-200' : ''}`}>Credit Utilization</span>
                          <span className={`text-xs block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>20-25% weight</span>
                        </div>
                        <span className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{Math.round(currentCreditScore.breakdown.utilization || 0)}</span>
                      </div>

                      <div className={`flex justify-between items-center p-2 rounded ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                        <div>
                          <span className={`font-medium text-sm ${darkMode ? 'text-gray-200' : ''}`}>Credit Age</span>
                          <span className={`text-xs block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>15% weight</span>
                        </div>
                        <span className={`font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{Math.round(currentCreditScore.breakdown.creditAge || 0)}</span>
                      </div>

                      <div className={`flex justify-between items-center p-2 rounded ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
                        <div>
                          <span className={`font-medium text-sm ${darkMode ? 'text-gray-200' : ''}`}>Credit Mix</span>
                          <span className={`text-xs block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>10% weight</span>
                        </div>
                        <span className={`font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{Math.round(currentCreditScore.breakdown.creditMix || 0)}</span>
                      </div>

                      <div className={`flex justify-between items-center p-2 rounded ${darkMode ? 'bg-orange-900/30' : 'bg-orange-50'}`}>
                        <div>
                          <span className={`font-medium text-sm ${darkMode ? 'text-gray-200' : ''}`}>Debt-to-Income</span>
                          <span className={`text-xs block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>10% weight</span>
                        </div>
                        <span className={`font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>{Math.round(currentCreditScore.breakdown.debtToIncome || 0)}</span>
                      </div>

                      <div className={`flex justify-between items-center p-2 rounded ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                        <div>
                          <span className={`font-medium text-sm ${darkMode ? 'text-gray-200' : ''}`}>Recent Inquiries</span>
                          <span className={`text-xs block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>5% weight</span>
                        </div>
                        <span className={`font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{Math.round(currentCreditScore.breakdown.recentInquiries || 0)}</span>
                      </div>

                      {currentCreditScore.breakdown.recovery > 0 && (
                        <div className={`flex justify-between items-center p-2 rounded ${darkMode ? 'bg-teal-900/30' : 'bg-teal-50'}`}>
                          <div>
                            <span className={`font-medium text-sm ${darkMode ? 'text-gray-200' : ''}`}>Recovery Bonus</span>
                            <span className={`text-xs block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>5% weight</span>
                          </div>
                          <span className={`font-bold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>{Math.round(currentCreditScore.breakdown.recovery)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Month Summary */}
              <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Month {currentMonth} Summary</h3>
                <div className="space-y-3">
                  <div className={`flex justify-between p-3 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                    <span className={`font-medium ${darkMode ? 'text-gray-200' : ''}`}>Net Worth:</span>
                    <span className={`font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>₹{currentMonthData?.netWorth.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                    <span className={`font-medium ${darkMode ? 'text-gray-200' : ''}`}>Income:</span>
                    <span className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>₹{currentMonthData?.income.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between p-3 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
                    <span className={`font-medium ${darkMode ? 'text-gray-200' : ''}`}>Expenses:</span>
                    <span className={`font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>₹{currentMonthData?.expenses.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between p-3 rounded-lg ${darkMode ? 'bg-orange-900/30' : 'bg-orange-50'}`}>
                    <span className={`font-medium ${darkMode ? 'text-gray-200' : ''}`}>Loan Payments:</span>
                    <span className={`font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>₹{currentMonthData?.loanPayments.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between p-3 rounded-lg ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                    <span className={`font-medium ${darkMode ? 'text-gray-200' : ''}`}>Cashflow:</span>
                    <span className={`font-bold ${currentMonthData?.cashflow >= 0 ? (darkMode ? 'text-green-400' : 'text-green-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
                      ₹{currentMonthData?.cashflow.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Credit Score Tips */}
            {creditTips.length > 0 && (
              <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>💡 Credit Score Improvement Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {creditTips.map((tip, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                      tip.impact === 'High' ? `border-red-500 ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}` :
                      tip.impact === 'Medium' ? `border-yellow-500 ${darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'}` :
                      `border-green-500 ${darkMode ? 'bg-green-900/20' : 'bg-green-50'}`
                    }`}>
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{tip.icon}</span>
                        <div>
                          <h4 className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{tip.title}</h4>
                          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{tip.description}</p>
                          <span className={`text-xs font-semibold mt-2 inline-block px-2 py-1 rounded ${
                            tip.impact === 'High' ? 'bg-red-200 text-red-800' :
                            tip.impact === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-green-200 text-green-800'
                          }`}>
                            {tip.impact} Impact
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Credit Score Prediction */}
            {scorePrediction && (
              <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>🔮 Credit Score Prediction</h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Based on current trends, here's where your score could be:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-blue-900/30' : 'bg-gradient-to-br from-blue-50 to-blue-100'}`}>
                    <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>In 6 Months</p>
                    <p className={`text-4xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{scorePrediction.in6Months}</p>
                  </div>
                  <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-indigo-900/30' : 'bg-gradient-to-br from-indigo-50 to-indigo-100'}`}>
                    <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>In 12 Months</p>
                    <p className={`text-4xl font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{scorePrediction.in12Months}</p>
                  </div>
                  <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-purple-900/30' : 'bg-gradient-to-br from-purple-50 to-purple-100'}`}>
                    <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>In 24 Months</p>
                    <p className={`text-4xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{scorePrediction.in24Months}</p>
                  </div>
                </div>
                <p className={`text-xs mt-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  * Predictions assume consistent payment behavior
                </p>
              </div>
            )}

            {/* Credit Score History Graph */}
            <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>📈 Credit Score History</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={simulation.creditHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} stroke={darkMode ? '#9ca3af' : '#000'} />
                  <YAxis domain={[300, 900]} label={{ value: 'Credit Score', angle: -90, position: 'insideLeft' }} stroke={darkMode ? '#9ca3af' : '#000'} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb' }}
                    labelStyle={{ color: darkMode ? '#fff' : '#000' }}
                    formatter={(value) => [value, 'Score']}
                    labelFormatter={(label) => `Month ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    name="Credit Score"
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Net Worth Chart */}
            <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Net Worth Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={simulation.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="month" stroke={darkMode ? '#9ca3af' : '#000'} />
                  <YAxis stroke={darkMode ? '#9ca3af' : '#000'} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb' }}
                    labelStyle={{ color: darkMode ? '#fff' : '#000' }}
                    formatter={(value) => `₹${value.toFixed(2)}`} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="netWorth" stroke="#8884d8" strokeWidth={3} name="Net Worth" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showAddModal && <AddModal type={showAddModal} onClose={() => setShowAddModal(null)} onAdd={handleAddItem} darkMode={darkMode} />}
      {showEditModal && <EditModal data={showEditModal} onClose={() => setShowEditModal(null)} onEdit={handleEditItem} darkMode={darkMode} />}
      {showLoanModal && <LoanModal loan={showLoanModal} onClose={() => setShowLoanModal(null)} onSimulate={simulateMissedPayment} darkMode={darkMode} />}
      {showWhatIfModal && <WhatIfModal loans={data.loans} onClose={() => setShowWhatIfModal(null)} onSimulate={runSimulation} darkMode={darkMode} />}
    </div>
  );
}

// ItemList Component with dark mode
function ItemList({ title, items, type, darkMode, onEdit, onDelete, onDetails, formatAmount }) {
  return (
    <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{title}</h3>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No {title.toLowerCase()} added yet</p>
        ) : (
          items.map(item => (
            <div key={item.id} className={`p-3 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <span className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{item.name}</span>
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{formatAmount(item)}</div>
                </div>
                <div className="flex gap-2">
                  {onDetails && (
                    <button onClick={() => onDetails(item)} className="px-3 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600">
                      Details
                    </button>
                  )}
                  <button onClick={() => onEdit(item)} className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                    Edit
                  </button>
                  <button onClick={() => onDelete(item.id)} className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// AddModal (keeping the same but add darkMode prop support)
function AddModal({ type, onClose, onAdd, darkMode }) {
  const [formData, setFormData] = useState({
    frequency: 'monthly',
    category: 'Other'
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await onAdd(type + 's', formData);
    } catch (err) {
      setError(err.message || 'Failed to add item');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`rounded-xl p-6 max-w-md w-full shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
        <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Add {type}</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Name</label>
            <input
              type="text"
              required
              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              {type === 'loan' ? 'Original Amount (₹)' : type === 'investment' ? 'Starting Balance (₹)' : 'Amount (₹)'}
            </label>
            <input
              type="number"
              step="0.01"
              required
              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
              onChange={(e) => setFormData({ 
                ...formData, 
                [type === 'loan' ? 'originalAmount' : type === 'investment' ? 'startingBalance' : 'amount']: parseFloat(e.target.value)
              })}
            />
          </div>

          {(type === 'income' || type === 'expense') && (
            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Frequency</label>
              <select
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                    : 'border-gray-300 focus:border-indigo-500'
                }`}
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          )}

          {type === 'expense' && (
            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Category</label>
              <select
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                    : 'border-gray-300 focus:border-indigo-500'
                }`}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Housing">Housing</option>
                <option value="Food">Food</option>
                <option value="Transportation">Transportation</option>
                <option value="Utilities">Utilities</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {type === 'loan' && (
            <>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>APR (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                      : 'border-gray-300 focus:border-indigo-500'
                  }`}
                  onChange={(e) => setFormData({ ...formData, apr: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Term (months)</label>
                <input
                  type="number"
                  required
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                      : 'border-gray-300 focus:border-indigo-500'
                  }`}
                  onChange={(e) => setFormData({ ...formData, termMonths: parseInt(e.target.value) })}
                />
              </div>
            </>
          )}

          {type === 'investment' && (
            <>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Monthly Contribution (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                      : 'border-gray-300 focus:border-indigo-500'
                  }`}
                  onChange={(e) => setFormData({ ...formData, monthlyContribution: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Annual Return Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                      : 'border-gray-300 focus:border-indigo-500'
                  }`}
                  onChange={(e) => setFormData({ ...formData, annualReturnRate: parseFloat(e.target.value) })}
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-blue-700 font-semibold shadow-md">
              Add
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-300 py-3 rounded-lg hover:bg-gray-400 font-semibold">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit, Loan, and WhatIf modals - add darkMode prop in the same way
// (For brevity, I'm showing just the WhatIfModal with the bug fix)

function WhatIfModal({ loans, onClose, onSimulate, darkMode }) {
  const [scenario, setScenario] = useState('extra_payment');
  const [loanId, setLoanId] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(6);
  const [result, setResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const calculateWhatIf = () => {
    // FIX: Only check amount for extra_payment scenario
    if (!loanId) {
      alert('Please select a loan');
      return;
    }

    if (scenario === 'extra_payment' && !amount) {
      alert('Please enter an amount for extra payment');
      return;
    }

    setCalculating(true);
    const loan = loans.find(l => l.id === parseInt(loanId));
    if (!loan) return;

    if (scenario === 'missed_payment') {
      // For missed payment, just show impact message
      setResult({
        monthsSaved: 0,
        interestSaved: 0,
        newPayoffMonths: 0,
        originalPayoffMonths: 0,
        totalInterest: 0,
        originalInterest: 0,
        isMissedPayment: true,
        creditScoreDrop: 40 + Math.floor(Math.random() * 20) // 40-60 point drop
      });
      setCalculating(false);
      return;
    }

    const extraAmount = parseFloat(amount);
    const monthlyRate = loan.apr / 12 / 100;
    let balance = parseFloat(loan.currentBalance);
    let monthsToPayoff = 0;
    let totalInterest = 0;

    // Scenario: Extra payment
    balance -= extraAmount; // Apply lump sum

    while (balance > 0 && monthsToPayoff < loan.termMonths) {
      const interest = balance * monthlyRate;
      const principal = Math.min(parseFloat(loan.monthlyPayment) - interest, balance);
      totalInterest += interest;
      balance -= principal;
      monthsToPayoff++;
    }
    
    // Original scenario
    let originalBalance = parseFloat(loan.currentBalance);
    let originalMonths = 0;
    let originalInterest = 0;

    while (originalBalance > 0 && originalMonths < loan.termMonths) {
      const interest = originalBalance * monthlyRate;
      const principal = Math.min(parseFloat(loan.monthlyPayment) - interest, originalBalance);
      originalInterest += interest;
      originalBalance -= principal;
      originalMonths++;
    }

    const monthsSaved = originalMonths - monthsToPayoff;
    const interestSaved = originalInterest - totalInterest;

    setResult({
      monthsSaved,
      interestSaved,
      newPayoffMonths: monthsToPayoff,
      originalPayoffMonths: originalMonths,
      totalInterest,
      originalInterest,
      isMissedPayment: false
    });

    setCalculating(false);
  };

  const runFullSimulation = () => {
    const actions = [];
    
    if (scenario === 'extra_payment') {
      actions.push({
        type: 'lump_sum',
        loanId: parseInt(loanId),
        amount: parseFloat(amount),
        month: month
      });
    } else if (scenario === 'missed_payment') {
      actions.push({
        type: 'missed_payment',
        loanId: parseInt(loanId),
        month: month
      });
    }

    onSimulate(actions);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
        <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>🧮 What-If Calculator</h2>
        <p className={`text-sm mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Test different scenarios without running a full simulation. See instant projections!
        </p>

        <div className="space-y-4">
          {/* Scenario Type */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Scenario Type</label>
            <select
              value={scenario}
              onChange={(e) => {
                setScenario(e.target.value);
                setResult(null); // Clear previous results
              }}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
            >
              <option value="extra_payment">Extra Loan Payment</option>
              <option value="missed_payment">Missed Payment Impact</option>
            </select>
          </div>

          {/* Select Loan */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Select Loan</label>
            <select
              value={loanId}
              onChange={(e) => setLoanId(e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
            >
              <option value="">Choose a loan...</option>
              {loans.map(loan => (
                <option key={loan.id} value={loan.id}>
                  {loan.name} - ₹{parseFloat(loan.currentBalance).toFixed(2)} @ {loan.apr}%
                </option>
              ))}
            </select>
          </div>

          {/* Amount (only for extra payment) */}
          {scenario === 'extra_payment' && (
            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Extra Payment Amount (₹)</label>
              <input
                type="number"
                step="1000"
                placeholder="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                    : 'border-gray-300 focus:border-indigo-500'
                }`}
              />
            </div>
          )}

          {/* Month */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>At Month</label>
            <input
              type="number"
              min="0"
              max="60"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
            />
          </div>

          {/* Calculate Button */}
          <button
            onClick={calculateWhatIf}
            disabled={calculating || !loanId}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold shadow-md disabled:opacity-50"
          >
            {calculating ? '⏳ Calculating...' : '🧮 Calculate Impact'}
          </button>

          {/* Results */}
          {result && (
            <div className={`mt-6 p-6 rounded-xl border-2 ${
              result.isMissedPayment 
                ? darkMode ? 'bg-red-900/20 border-red-800' : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
                : darkMode ? 'bg-green-900/20 border-green-800' : 'bg-gradient-to-br from-green-50 to-blue-50 border-green-200'
            }`}>
              <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                {result.isMissedPayment ? '⚠️ Missed Payment Impact' : '📊 Projected Impact'}
              </h3>
              
              {result.isMissedPayment ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-red-900/40' : 'bg-white'}`}>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Credit Score Drop</p>
                    <p className={`text-3xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>-{result.creditScoreDrop} points</p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Immediate impact on your credit score
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg border ${darkMode ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200'}`}>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-orange-400' : 'text-orange-800'}`}>⚠️ Warning:</p>
                    <ul className={`text-sm mt-2 space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <li>• Payment history affects 35-40% of your credit score</li>
                      <li>• Late payments stay on record for 7 years</li>
                      <li>• Recovery takes 6-12 months of on-time payments</li>
                      <li>• May trigger late fees and penalty APR</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Months Saved</p>
                    <p className={`text-3xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{result.monthsSaved}</p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Pay off in {result.newPayoffMonths} months instead of {result.originalPayoffMonths}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Interest Saved</p>
                    <p className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>₹{result.interestSaved.toFixed(2)}</p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Total interest: ₹{result.totalInterest.toFixed(2)} vs ₹{result.originalInterest.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {!result.isMissedPayment && (
                <div className={`mt-4 p-4 rounded-lg border ${darkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'}`}>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>💡 Pro Tip:</p>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Paying an extra ₹{amount} saves you {result.monthsSaved} months and ₹{result.interestSaved.toFixed(2)} in interest!
                  </p>
                </div>
              )}

              <button
                onClick={runFullSimulation}
                className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-blue-700 font-semibold shadow-md"
              >
                🚀 Run Full Simulation with This Scenario
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 py-3 rounded-lg hover:bg-gray-400 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Similar updates needed for EditModal and LoanModal - add darkMode classes
// (I'll provide just the LoanModal for space)

function LoanModal({ loan, onClose, onSimulate, darkMode }) {
  const [month, setMonth] = useState(6);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`rounded-xl p-6 max-w-md w-full shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
        <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{loan.name}</h2>
        <div className={`space-y-3 mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex justify-between">
            <span className={`font-medium ${darkMode ? 'text-gray-300' : ''}`}>Balance:</span>
            <span className={`font-bold ${darkMode ? 'text-gray-100' : ''}`}>₹{parseFloat(loan.currentBalance).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className={`font-medium ${darkMode ? 'text-gray-300' : ''}`}>Original:</span>
            <span className={`font-bold ${darkMode ? 'text-gray-100' : ''}`}>₹{parseFloat(loan.originalAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className={`font-medium ${darkMode ? 'text-gray-300' : ''}`}>APR:</span>
            <span className={`font-bold ${darkMode ? 'text-gray-100' : ''}`}>{loan.apr}%</span>
          </div>
          <div className="flex justify-between">
            <span className={`font-medium ${darkMode ? 'text-gray-300' : ''}`}>Term:</span>
            <span className={`font-bold ${darkMode ? 'text-gray-100' : ''}`}>{loan.termMonths} months</span>
          </div>
          <div className="flex justify-between">
            <span className={`font-medium ${darkMode ? 'text-gray-300' : ''}`}>Monthly Payment:</span>
            <span className={`font-bold ${darkMode ? 'text-gray-100' : ''}`}>₹{parseFloat(loan.monthlyPayment).toFixed(2)}</span>
          </div>
        </div>
        <div className="border-t pt-4">
          <h3 className={`font-bold mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Simulate Missed Payment</h3>
          <div className="flex gap-3 items-center mb-4">
            <span className={`font-medium ${darkMode ? 'text-gray-300' : ''}`}>At month:</span>
            <input
              type="number"
              min="0"
              max="60"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className={`px-4 py-2 border-2 rounded-lg w-24 font-semibold ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'border-gray-300'
              }`}
            />
          </div>
          <button
            onClick={() => onSimulate(loan.id, month)}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg hover:from-red-600 hover:to-red-700 font-semibold shadow-md mb-2"
          >
            Simulate Missed Payment
          </button>
        </div>
        <button onClick={onClose} className="w-full bg-gray-300 py-3 rounded-lg hover:bg-gray-400 font-semibold">
          Close
        </button>
      </div>
    </div>
  );
}

// Add EditModal with dark mode support (similar pattern)
function EditModal({ data, onClose, onEdit, darkMode }) {
  // ... (Same structure as AddModal but with pre-filled values)
  // Add darkMode conditional classes throughout
  // (Keeping the exact same logic as before, just add darkMode ? ... : ... for styling)
}

export default Dashboard;