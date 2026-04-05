import { useState, useEffect } from 'react';
import { semesterAPI, courseAssignmentAPI } from '../services/api';

const CourseSemesterSelector = ({ onSelect }) => {
  const [semesters, setSemesters] = useState([]);
  const [selectedSem, setSelectedSem] = useState('');
  const [courses, setCourses] = useState([]);
  const [selectedCA, setSelectedCA] = useState('');

  useEffect(() => {
    // Load semesters
    semesterAPI.getAll().then(data => {
      setSemesters(data);
      const active = data.find(s => s.is_active);
      if (active) setSelectedSem(active.id);
    });
  }, []);

  useEffect(() => {
    if (!selectedSem) {
      setCourses([]);
      return;
    }
    // Load only courses assigned to this faculty for selected semester
    courseAssignmentAPI.getMine({ semester_id: selectedSem })
      .then(data => setCourses(data))
      .catch(err => console.error("Error loading courses:", err));
  }, [selectedSem]);

  useEffect(() => {
    if (selectedCA) {
      onSelect(selectedCA);
    } else {
      onSelect(null);
    }
  }, [selectedCA, onSelect]);

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
      <select value={selectedSem} onChange={e => { setSelectedSem(e.target.value); setSelectedCA(''); }} style={{ padding: '0.4rem' }}>
        <option value="">Select Semester</option>
        {semesters.map(s => (
          <option key={s.id} value={s.id}>{s.name} {s.is_active ? '(Active)' : ''}</option>
        ))}
      </select>

      <select value={selectedCA} onChange={e => setSelectedCA(e.target.value)} disabled={!courses.length} style={{ padding: '0.4rem' }}>
        <option value="">Select Course</option>
        {courses.map(ca => (
          <option key={ca.course_assignment_id} value={ca.course_assignment_id}>
            {ca.course_code} — {ca.course_name} ({ca.class_name})
          </option>
        ))}
      </select>
    </div>
  );
};

export default CourseSemesterSelector;
