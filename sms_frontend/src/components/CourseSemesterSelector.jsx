import { useState, useEffect } from 'react';
import { courseAssignmentAPI, departmentAPI } from '../services/api';
import { jwtDecode } from 'jwt-decode';
const CourseSemesterSelector = ({ onSelect, initialValue }) => {
  const [allCourses, setAllCourses] = useState([]);
  const [courses, setCourses] = useState([]);
  
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedTerm, setSelectedTerm] = useState('current');
  const [selectedCA, setSelectedCA] = useState(initialValue || '');
  const [uniqueBatches, setUniqueBatches] = useState([]);

  useEffect(() => {
    courseAssignmentAPI.getMine()
      .then(async data => {
        setAllCourses(data);
        const batches = [...new Set(data.map(c => c.class_name))];
        setUniqueBatches(batches);
        
        let deptTerm = 'All';
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const { dept_id } = jwtDecode(token);
            if (dept_id) {
              const depts = await departmentAPI.getAll();
              const myDept = depts.find(d => d.id === dept_id);
              if (myDept && (myDept.active_term === 'odd' || myDept.active_term === 'even')) {
                deptTerm = myDept.active_term;
              }
            }
          }
        } catch (e) {
          console.error("Error fetching department:", e);
        }

        if (selectedTerm === 'current') {
          setSelectedTerm(deptTerm);
        }

        if (initialValue) {
          const course = data.find(c => (c.course_assignment_id || c.id) === initialValue);
          if (course) {
            setSelectedBatch(course.class_name);
            // Always defer to the department's active term rather than the course's term
            setSelectedTerm(deptTerm);
          }
        }
      })
      .catch(err => console.error("Error loading courses:", err));
  }, []);

  useEffect(() => {
    let filtered = allCourses;
    
    if (selectedBatch !== 'All') {
      filtered = filtered.filter(c => c.class_name === selectedBatch);
    }
    
    if (selectedTerm !== 'All') {
      filtered = filtered.filter(c => {
        const pn = parseInt(c.period_number, 10);
        if (!isNaN(pn)) {
          const isOdd = pn % 2 !== 0;
          return selectedTerm === 'odd' ? isOdd : !isOdd;
        }
        return true; // keep courses with no period_number
      });
    }
    
    setCourses(filtered);
    
    if (selectedCA && !filtered.find(c => (c.course_assignment_id || c.id) === selectedCA)) {
      setSelectedCA('');
    }
  }, [selectedBatch, selectedTerm, allCourses]);

  useEffect(() => {
    onSelect(selectedCA || null);
  }, [selectedCA, onSelect]);

  const selectStyle = {
    padding: '0.8rem 1rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b',
    fontSize: '0.95rem', fontWeight: '500', outline: 'none', minWidth: '200px', cursor: 'pointer', transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  };
  const containerStyle = {
    display: 'flex', gap: '1.5rem', marginBottom: '2rem', alignItems: 'center', flexWrap: 'wrap',
    background: '#f1f5f9', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0'
  };
  const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={containerStyle}>
        <div>
          <label style={labelStyle}>Select Batch</label>
          <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} style={selectStyle}>
            <option value="All">All Batches</option>
            {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Select Term</label>
          <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} style={selectStyle}>
            <option value="All">All Terms</option>
            <option value="odd">Odd Semester</option>
            <option value="even">Even Semester</option>
          </select>
        </div>

        {selectedCA && (
          <div>
            <label style={labelStyle}>Select Course</label>
            <select value={selectedCA} onChange={e => setSelectedCA(e.target.value)} style={selectStyle}>
              <option value="">-- Back to All Courses --</option>
              {courses.map(ca => {
                const caId = ca.course_assignment_id || ca.id;
                return <option key={caId} value={caId}>{ca.course_code} — {ca.course_name} ({ca.class_name})</option>;
              })}
            </select>
          </div>
        )}
      </div>

      {!selectedCA && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          {courses.map(ca => {
            const caId = ca.course_assignment_id || ca.id;
            const semMatch = ca.semester_name?.match(/\d+/);
            const semText = semMatch ? `Sem ${semMatch[0]}` : ca.semester_name;
            
            return (
              <div 
                key={caId} 
                onClick={() => setSelectedCA(caId)}
                style={{
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem',
                  cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', overflow: 'hidden'
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#007bff' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ background: '#cce5ff', color: '#007bff', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' }}>{ca.course_code}</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{semText}</span>
                </div>
                <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.1rem', color: '#1e293b', fontWeight: '700', lineHeight: '1.4' }}>{ca.course_name}</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Class: {ca.class_name} {ca.section ? `(${ca.section})` : ''}</p>
                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#3b82f6', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>Manage Contents <span style={{ fontSize: '1rem' }}>→</span></div>
              </div>
            );
          })}
          {courses.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '12px', color: '#64748b', border: '2px dashed #e2e8f0' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>📭</span>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>No courses found for the selected criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseSemesterSelector;
