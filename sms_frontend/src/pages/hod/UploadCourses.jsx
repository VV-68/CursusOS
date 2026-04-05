import { useState, useEffect } from 'react';
import { semesterAPI, departmentAPI, getMe } from '../../services/api';

function UploadCourses() {
  const [semesters, setSemesters] = useState([]);
  const [selectedSem, setSelectedSem] = useState('');
  const [deptId, setDeptId] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [currentCourses, setCurrentCourses] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Load semesters
    semesterAPI.getAll().then(data => {
      setSemesters(data);
      const active = data.find(s => s.is_active);
      if (active) setSelectedSem(active.id);
    }).catch(err => console.error(err));

    // Get dept_id of current HOD
    getMe().then(user => {
      setDeptId(user.dept_id);
    }).catch(err => console.error(err));
  }, []);

  const handleFileChange = (e) => {
    if (!e.target.files[0]) return;
    const selected = e.target.files[0];
    setFile(selected);
    setMessage('');
    setError('');

    // Client-side preview
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (json.courses && Array.isArray(json.courses)) {
          setPreview(json.courses);
        } else {
          setPreview([]);
          setError("Invalid JSON format. Expected { courses: [...] }");
        }
      } catch (err) {
        setPreview([]);
        setError("Error parsing JSON file");
      }
    };
    reader.readAsText(selected);
  };

  const handleUpload = async () => {
    if (!file) return setError('Please select a file');
    if (!selectedSem) return setError('Please select a semester');
    if (!deptId) return setError('Department ID not found');

    // Make sure JSON has semester_id, backend requires it in the file.
    try {
      const payload = {
        semester_id: selectedSem,
        courses: preview
      };
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const newFile = new File([blob], file.name, { type: 'application/json' });
      
      const res = await departmentAPI.uploadCourses(deptId, newFile);
      setMessage(res.message);
      setError('');
      loadCurrentCourses();
    } catch (err) {
      setError(err.message);
    }
  };

  const loadCurrentCourses = async () => {
    if (!selectedSem || !deptId) return;
    try {
      const res = await departmentAPI.getCourses(deptId, selectedSem);
      setCurrentCourses(res);
      setMessage('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Upload Department Courses</h2>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <select value={selectedSem} onChange={e => { setSelectedSem(e.target.value); setCurrentCourses([]); }} style={{ padding: '0.5rem' }}>
          <option value="">Select Semester</option>
          {semesters.map(s => (
            <option key={s.id} value={s.id}>{s.name} {s.is_active ? '(Active)' : ''}</option>
          ))}
        </select>
        
        <input type="file" accept=".json" onChange={handleFileChange} />
        
        <button onClick={handleUpload} style={{ padding: '0.5rem 1rem', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }} disabled={!file || !preview.length}>
          Upload & Sync
        </button>

        <button onClick={loadCurrentCourses} style={{ padding: '0.5rem 1rem', background: '#ccc', border: 'none', cursor: 'pointer' }}>
          View Current Courses
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {preview.length > 0 && (
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h3>Preview Upload</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#eee', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Code</th>
                  <th style={{ padding: '8px' }}>Name</th>
                  <th style={{ padding: '8px' }}>Credits</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '8px' }}>{c.code}</td>
                    <td style={{ padding: '8px' }}>{c.name}</td>
                    <td style={{ padding: '8px' }}>{c.credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {currentCourses.length > 0 && (
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h3>Current Courses in DB</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#eee', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Code</th>
                  <th style={{ padding: '8px' }}>Name</th>
                  <th style={{ padding: '8px' }}>Credits</th>
                </tr>
              </thead>
              <tbody>
                {currentCourses.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '8px' }}>{c.code}</td>
                    <td style={{ padding: '8px' }}>{c.name}</td>
                    <td style={{ padding: '8px' }}>{c.credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadCourses;
