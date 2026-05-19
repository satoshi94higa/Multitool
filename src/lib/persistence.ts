export interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  output: any;
  title: string;
}

export const saveToHistory = (key: string, input: string, output: any, title: string) => {
  try {
    const existingHistory = JSON.parse(localStorage.getItem(`history_${key}`) || '[]');
    
    // Fallback for crypto.randomUUID
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);

    const newItem: HistoryItem = {
      id,
      timestamp: Date.now(),
      input,
      output,
      title
    };

    // Agregar al principio y limitar a 10
    const newHistory = [newItem, ...existingHistory].slice(0, 10);
    localStorage.setItem(`history_${key}`, JSON.stringify(newHistory));
    return newHistory;
  } catch (e) {
    console.error('Error saving to history:', e);
    return [];
  }
};

export const getHistory = (key: string): HistoryItem[] => {
  try {
    return JSON.parse(localStorage.getItem(`history_${key}`) || '[]');
  } catch (e) {
    console.error('Error getting history:', e);
    return [];
  }
};

export const deleteFromHistory = (key: string, id: string) => {
  try {
    const existingHistory = JSON.parse(localStorage.getItem(`history_${key}`) || '[]');
    const newHistory = existingHistory.filter((item: HistoryItem) => item.id !== id);
    localStorage.setItem(`history_${key}`, JSON.stringify(newHistory));
    return newHistory;
  } catch (e) {
    console.error('Error deleting from history:', e);
    return [];
  }
};
