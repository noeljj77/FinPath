import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scenarios, loans } from '../services/api';

function ScenarioManager({ user, onLogout }) {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [scenariosList, setScenariosList] = useState([]);
  const [userLoans, setUserLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);

  useEffect(() => {
    loadData();
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  const loadData = async () => {
    try {
      const [scenariosRes, loansRes] = await Promise.all([
        scenarios.getAll(),
        loans.getAll()
      ]);
      setScenariosList(scenariosRes.data);
      setUserLoans(loansRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createScenario = async (scenario) => {
    try {
      await scenarios.create(scenario);
      await loadData();
      setShowCreateModal(false);
    } catch (error) {
      alert('Failed to create scenario: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteScenario = async (id) => {
    if (!confirm('Are you sure you want to delete this scenario?')) return;
    
    try {
      await scenarios.delete(id);
      await loadData();
    } catch (error) {
      alert('Failed to delete scenario: ' + (error.response?.data?.error || error.message));
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
                🎯 Scenario Manager
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
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-semibold shadow-lg"
          >
            ➕ Create New Scenario
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenariosList.length === 0 ? (
            <div className={`col-span-full rounded-xl shadow-lg p-12 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="text-6xl mb-4">📋</div>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>No Scenarios Yet</h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Create your first scenario to test different financial situations</p>
            </div>
          ) : (
            scenariosList.map((scenario) => (
              <div key={scenario.id} className={`rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`text-xl font-bold flex-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{scenario.name}</h3>
                  <button
                    onClick={() => handleDeleteScenario(scenario.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-semibold"
                    title="Delete scenario"
                  >
                    🗑️
                  </button>
                </div>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{scenario.description || 'No description'}</p>
                <div className="space-y-2 mb-4 text-sm">
                  <div className={`flex justify-between p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : ''}`}>Duration:</span>
                    <span className={`font-bold ${darkMode ? 'text-gray-200' : ''}`}>{scenario.months} months</span>
                  </div>
                  <div className={`flex justify-between p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : ''}`}>Actions:</span>
                    <span className={`font-bold ${darkMode ? 'text-gray-200' : ''}`}>{scenario.actions?.length || 0}</span>
                  </div>
                  {scenario.results && (
                    <>
                      <div className={`flex justify-between p-2 rounded ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                        <span className={`font-medium ${darkMode ? 'text-gray-300' : ''}`}>Final Net Worth:</span>
                        <span className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>₹{scenario.results.finalNetWorth?.toFixed(2)}</span>
                      </div>
                      <div className={`flex justify-between p-2 rounded ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                        <span className={`font-medium ${darkMode ? 'text-gray-300' : ''}`}>Final Credit Score:</span>
                        <span className={`font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{scenario.results.finalCreditScore}</span>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setSelectedScenario(scenario)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 font-semibold shadow-md"
                >
                  View Details
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateScenarioModal
          loans={userLoans}
          darkMode={darkMode}
          onClose={() => setShowCreateModal(false)}
          onCreate={createScenario}
        />
      )}

      {selectedScenario && (
        <ScenarioDetailModal
          scenario={selectedScenario}
          darkMode={darkMode}
          onClose={() => setSelectedScenario(null)}
        />
      )}
    </div>
  );
}

// CreateScenarioModal with dark mode
function CreateScenarioModal({ loans, darkMode, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    months: 12,
    actions: []
  });

  const [newAction, setNewAction] = useState({
    type: 'missed_payment',
    month: 0
  });

  const addAction = () => {
    if (newAction.type === 'missed_payment' && !newAction.loanId) {
      alert('Please select a loan');
      return;
    }
    if (newAction.type === 'lump_sum' && (!newAction.loanId || !newAction.amount)) {
      alert('Please fill all fields');
      return;
    }
    setFormData({
      ...formData,
      actions: [...formData.actions, { ...newAction }]
    });
    setNewAction({ type: 'missed_payment', month: 0 });
  };

  const removeAction = (index) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  const getActionDescription = (action) => {
    if (action.type === 'missed_payment') {
      const loan = loans.find(l => l.id === action.loanId);
      return `Miss payment on ${loan?.name || 'Loan'} at month ${action.month}`;
    }
    if (action.type === 'lump_sum') {
      const loan = loans.find(l => l.id === action.loanId);
      return `Pay ₹${action.amount} toward ${loan?.name || 'Loan'} at month ${action.month}`;
    }
    return 'Unknown action';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto z-50" onClick={onClose}>
      <div className={`rounded-xl p-6 max-w-2xl w-full my-8 shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
        <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Create New Scenario</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Scenario Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Emergency Fund Test"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Description</label>
            <textarea
              placeholder="Describe what this scenario tests..."
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Duration (months)</label>
            <input
              type="number"
              min="1"
              max="360"
              required
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
              value={formData.months}
              onChange={(e) => setFormData({ ...formData, months: parseInt(e.target.value) })}
            />
          </div>

          <div className="border-t pt-5">
            <h3 className={`font-bold mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>📝 Actions to Simulate</h3>
            
            <div className="space-y-2 mb-4">
              {formData.actions.map((action, index) => (
                <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                  <span className={`flex-1 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {getActionDescription(action)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAction(index)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {formData.actions.length === 0 && (
                <p className={`text-sm text-center py-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No actions added yet</p>
              )}
            </div>

            <div className={`p-4 rounded-lg space-y-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h4 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Add New Action</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Action Type</label>
                  <select
                    value={newAction.type}
                    onChange={(e) => setNewAction({ ...newAction, type: e.target.value, loanId: undefined, amount: undefined })}
                    className={`w-full px-3 py-2 border-2 rounded-lg text-sm focus:outline-none ${
                      darkMode 
                        ? 'bg-gray-600 border-gray-500 text-white focus:border-indigo-500' 
                        : 'border-gray-300 focus:border-indigo-500'
                    }`}
                  >
                    <option value="missed_payment">Missed Payment</option>
                    <option value="lump_sum">Lump Sum Payment</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>At Month</label>
                  <input
                    type="number"
                    min="0"
                    value={newAction.month}
                    onChange={(e) => setNewAction({ ...newAction, month: parseInt(e.target.value) })}
                    className={`w-full px-3 py-2 border-2 rounded-lg text-sm focus:outline-none ${
                      darkMode 
                        ? 'bg-gray-600 border-gray-500 text-white focus:border-indigo-500' 
                        : 'border-gray-300 focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Select Loan</label>
                <select
                  value={newAction.loanId || ''}
                  onChange={(e) => setNewAction({ ...newAction, loanId: parseInt(e.target.value) })}
                  className={`w-full px-3 py-2 border-2 rounded-lg text-sm focus:outline-none ${
                    darkMode 
                      ? 'bg-gray-600 border-gray-500 text-white focus:border-indigo-500' 
                      : 'border-gray-300 focus:border-indigo-500'
                  }`}
                >
                  <option value="">Choose a loan...</option>
                  {loans.map(loan => (
                    <option key={loan.id} value={loan.id}>{loan.name} (₹{parseFloat(loan.currentBalance).toFixed(2)})</option>
                  ))}
                </select>
              </div>

              {newAction.type === 'lump_sum' && (
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Payment Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="5000"
                    value={newAction.amount || ''}
                    onChange={(e) => setNewAction({ ...newAction, amount: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 border-2 rounded-lg text-sm focus:outline-none ${
                      darkMode 
                        ? 'bg-gray-600 border-gray-500 text-white focus:border-indigo-500' 
                        : 'border-gray-300 focus:border-indigo-500'
                    }`}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={addAction}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold shadow-md"
              >
                ➕ Add Action
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-blue-700 font-semibold shadow-lg"
            >
              🚀 Create & Run Scenario
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 py-3 rounded-lg hover:bg-gray-400 font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ScenarioDetailModal with dark mode
function ScenarioDetailModal({ scenario, darkMode, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`rounded-xl p-6 max-w-2xl w-full shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
        <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{scenario.name}</h2>
        
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h3 className={`font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Description</h3>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{scenario.description || 'No description provided'}</p>
          </div>

          <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <h3 className={`font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Duration</h3>
            <p className={`text-lg font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{scenario.months} months</p>
          </div>

          <div className={`p-4 rounded-lg ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
            <h3 className={`font-bold mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Actions Performed ({scenario.actions?.length || 0})</h3>
            {scenario.actions && scenario.actions.length > 0 ? (
              <div className="space-y-2">
                {scenario.actions.map((action, index) => (
                  <div key={index} className={`text-sm p-3 rounded shadow-sm ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white'}`}>
                    <span className="font-medium">Action {index + 1}:</span>{' '}
                    {action.type === 'missed_payment' && `Missed payment on loan ${action.loanId} at month ${action.month}`}
                    {action.type === 'lump_sum' && `Paid ₹${action.amount} toward loan ${action.loanId} at month ${action.month}`}
                  </div>
                ))}
              </div>
            ) : (
              <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No actions were defined for this scenario</p>
            )}
          </div>

          {scenario.results && (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
              <h3 className={`font-bold mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Simulation Results</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded shadow-sm ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Final Net Worth</div>
                  <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>₹{scenario.results.finalNetWorth?.toFixed(2)}</div>
                </div>
                <div className={`p-3 rounded shadow-sm ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Final Credit Score</div>
                  <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{scenario.results.finalCreditScore}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-blue-700 font-semibold shadow-md"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default ScenarioManager;