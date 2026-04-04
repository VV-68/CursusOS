import { useState, useEffect } from 'react';
import { getStudents, searchStudents } from '../services/api';
import StudentTable from '../components/StudentTable';

const DEPARTMENTS = ['CSE', 'ECE', 'EE', 'ME', 'Civil', 'IT'];

function Students() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [department, setDepartment] = useState('');
  const [sort, setSort] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const isSearching = searchQuery.trim() !== '';

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        if (isSearching) {
          const data = await searchStudents(searchQuery);
          setStudents(Array.isArray(data) ? data : []);
          setTotal(Array.isArray(data) ? data.length : 0);
        } else {
          const params = { page, limit };
          if (department) params.department = department;
          if (sort) params.sort = sort;
          const data = await getStudents(params);
          const arr = Array.isArray(data) ? data : [];
          setStudents(arr);
          setTotal(arr.length);
        }
      } catch (err) {
        setError(err.message || 'Failed to load students');
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page, limit, department, sort, searchQuery, isSearching, refreshKey]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchName.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchName('');
    setSearchQuery('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="students-page">
      <h1>Students</h1>

      <div className="students-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
          {isSearching && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClearSearch}
            >
              Clear
            </button>
          )}
        </form>

        {!isSearching && (
          <div className="filters">
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              className="filter-select"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="filter-select"
            >
              <option value="">Sort by</option>
              <option value="marks">Marks</option>
            </select>
          </div>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <StudentTable students={students} onRefresh={() => setRefreshKey((k) => k + 1)} />
          {!isSearching && total > 0 && (
            <div className="pagination">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span className="page-info">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Students;
