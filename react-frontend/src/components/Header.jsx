import React, { useState, useRef } from 'react';
import Store from '../api/store.js';

export default function Header({ activeView }) {
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearch(term);
    const normalized = term.toLowerCase();
    // search active tbody rows
    document.querySelectorAll('.view-section tbody tr, .content-area tbody tr').forEach(row => {
      row.style.display = row.innerText.toLowerCase().includes(normalized) ? '' : 'none';
    });
  };

  return (
    <div className="top-header">
      <div className="search-bar">
        <span className="material-symbols-outlined search-icon">search</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search in current view..."
          value={search}
          onChange={handleSearch}
        />
      </div>
      <div className="header-actions">
        <span className="material-symbols-outlined icon-btn" style={{ fontSize: '1.4rem' }}>notifications</span>
      </div>
    </div>
  );
}
