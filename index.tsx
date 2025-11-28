import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

// --- TYPES ---
interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
}

const CATEGORIES = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];

// --- STYLES ---
const styles: { [key: string]: React.CSSProperties } = {
  header: {
    backgroundColor: '#0D47A1',
    color: 'white',
    padding: '16px',
    textAlign: 'center',
    borderRadius: '8px',
    marginBottom: '24px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    margin: 0,
    fontSize: '2rem',
    fontWeight: 500,
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '24px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  summaryGrid: {
    display: 'flex',
    justifyContent: 'space-around',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  summaryItem: {
    padding: '8px',
    minWidth: '100px',
  },
  summaryLabel: {
    fontSize: '0.9rem',
    color: '#616161',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  summaryValue: {
    fontSize: '1.5rem',
    fontWeight: '500',
  },
  editButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    fontSize: '1rem',
  },
  progressBarContainer: {
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    height: '8px',
    marginTop: '16px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease-in-out, background-color 0.3s ease-in-out',
  },
  expenseList: {
    listStyle: 'none',
    padding: 0,
    margin: '0',
  },
  expenseItem: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  expenseTitle: {
    fontWeight: 500,
    fontSize: '1.1rem',
    marginBottom: '4px',
  },
  expenseMeta: {
    fontSize: '0.8rem',
    color: '#757575',
  },
  expenseAmount: {
    fontSize: '1.2rem',
    fontWeight: 500,
  },
  button: {
    backgroundColor: '#0D47A1',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 500,
    width: '100%',
    marginBottom: '16px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'background-color 0.2s',
  },
  form: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '24px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    width: 'calc(100% - 20px)',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  },
  deleteButton: {
    backgroundColor: '#D32F2F',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
};

// --- MAIN APP COMPONENT ---
const App = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalBudget, setTotalBudget] = useState<number>(1000);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Load data from localStorage on initial render
  useEffect(() => {
    try {
      const storedExpenses = localStorage.getItem('expenses');
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
      const storedBudget = localStorage.getItem('totalBudget');
      if (storedBudget) setTotalBudget(JSON.parse(storedBudget));
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('expenses', JSON.stringify(expenses));
    } catch (error) {
      console.error("Failed to save expenses to localStorage", error);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem('totalBudget', JSON.stringify(totalBudget));
    } catch (error) {
      console.error("Failed to save budget to localStorage", error);
    }
  }, [totalBudget]);

  const { totalSpent, remainingBudget } = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const spent = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
    return { totalSpent: spent, remainingBudget: totalBudget - spent };
  }, [expenses, totalBudget]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid title and amount.");
      return;
    }
    const newExpense: Expense = {
      id: new Date().toISOString(),
      title,
      amount: parseFloat(amount),
      category,
      date,
    };
    setExpenses([newExpense, ...expenses]);
    
    setTitle('');
    setAmount('');
    setCategory(CATEGORIES[0]);
    setDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      setExpenses(expenses.filter(expense => expense.id !== id));
    }
  };

  const handleEditBudget = () => {
    const newBudgetStr = prompt("Enter your new monthly budget:", totalBudget.toString());
    if (newBudgetStr !== null) {
      const newBudget = parseFloat(newBudgetStr);
      if (!isNaN(newBudget) && newBudget >= 0) {
        setTotalBudget(newBudget);
      } else {
        alert("Please enter a valid number for the budget.");
      }
    }
  };
  
  const getRemainingColor = (remaining: number, budget: number) => {
    if (budget <= 0) return '#616161';
    const percentage = remaining / budget;
    if (percentage > 0.25) return '#4CAF50'; // Green
    if (percentage > 0) return '#FFC107'; // Amber
    return '#D32F2F'; // Red
  };

  const spentPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const progressBarColor = getRemainingColor(remainingBudget, totalBudget);

  return (
    <>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>ClearCoin</h1>
      </header>

      <main>
        <div style={styles.summaryCard}>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>
                Total Budget
                <button onClick={handleEditBudget} style={styles.editButton} aria-label="Edit Budget">✏️</button>
              </div>
              <div style={styles.summaryValue}>${totalBudget.toFixed(2)}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Spent (This Month)</div>
              <div style={{...styles.summaryValue, color: '#D32F2F'}}>${totalSpent.toFixed(2)}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Remaining</div>
              <div style={{ ...styles.summaryValue, color: getRemainingColor(remainingBudget, totalBudget) }}>
                ${remainingBudget.toFixed(2)}
              </div>
            </div>
          </div>
          <div style={styles.progressBarContainer}>
            <div style={{
              ...styles.progressBar,
              width: `${spentPercentage}%`,
              backgroundColor: progressBarColor,
            }}></div>
          </div>
        </div>

        <button style={styles.button} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add New Expense'}
        </button>

        {showForm && (
          <form style={styles.form} onSubmit={handleAddExpense}>
            <input
              type="text"
              placeholder="Expense Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
              aria-label="Expense Title"
              required
            />
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={styles.input}
              aria-label="Amount"
              min="0.01"
              step="0.01"
              required
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.input}
              aria-label="Category"
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={styles.input}
              aria-label="Date"
              required
            />
            <button type="submit" style={styles.button}>Save Expense</button>
          </form>
        )}
        
        <h2>Recent Expenses</h2>
        <ul style={styles.expenseList}>
          {expenses.length > 0 ? expenses.map(expense => (
            <li key={expense.id} style={styles.expenseItem}>
              <div style={styles.expenseDetails}>
                <span style={styles.expenseTitle}>{expense.title}</span>
                <span style={styles.expenseMeta}>{expense.category} &bull; {new Date(expense.date).toLocaleDateString()}</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <span style={styles.expenseAmount}>${expense.amount.toFixed(2)}</span>
                <button
                  onClick={() => handleDeleteExpense(expense.id)}
                  style={{...styles.deleteButton, marginLeft: '16px'}}
                  aria-label={`Delete ${expense.title}`}
                >
                  Delete
                </button>
              </div>
            </li>
          )) : (
            <p style={{textAlign: 'center', color: '#616161'}}>No expenses added yet. Click the button above to start tracking!</p>
          )}
        </ul>
      </main>
    </>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
