const ADMIN_ROLES = ['hod', 'faculty', 'student'];
const HOD_ROLES = ['faculty', 'student'];

const ROLE_LABELS = {
  hod: 'HODs',
  faculty: 'Faculty',
  student: 'Students'
};

/** Legacy dropdown map (kept for backward compatibility). */
const ADMIN_AUDIENCE_MAP = {
  hod: ['hod'],
  faculty: ['hod', 'faculty'],
  student: ['student'],
  both: ['hod', 'faculty']
};

const HOD_AUDIENCE_MAP = {
  faculty: ['faculty'],
  student: ['student'],
  both: ['faculty', 'student']
};

/**
 * Normalize checkbox selection to stored audience array.
 * Admin: faculty selection always includes HODs as recipients.
 */
const resolveAudienceRoles = (posterRole, audienceInput) => {
  let selected = [];

  if (Array.isArray(audienceInput)) {
    selected = audienceInput.map(r => String(r).toLowerCase().trim());
  } else if (typeof audienceInput === 'string' && audienceInput) {
    const key = audienceInput.toLowerCase();
    if (posterRole === 'admin' && ADMIN_AUDIENCE_MAP[key]) {
      selected = [...ADMIN_AUDIENCE_MAP[key]];
    } else if (posterRole === 'hod' && HOD_AUDIENCE_MAP[key]) {
      selected = [...HOD_AUDIENCE_MAP[key]];
    }
  }

  selected = [...new Set(selected.filter(Boolean))];

  if (posterRole === 'admin') {
    const filtered = selected.filter(r => ADMIN_ROLES.includes(r));
    if (!filtered.length) throw new Error('INVALID_AUDIENCE');
    const set = new Set(filtered);
    if (set.has('faculty')) set.add('hod');
    return [...set].sort();
  }

  if (posterRole === 'hod') {
    const filtered = selected.filter(r => HOD_ROLES.includes(r));
    if (!filtered.length) throw new Error('INVALID_AUDIENCE');
    return filtered.sort();
  }

  throw new Error('FORBIDDEN_AUDIENCE');
};

const viewerAudienceTags = (role) => {
  if (role === 'hod') return ['hod'];
  if (role === 'student') return ['student'];
  if (role === 'faculty' || role === 'advisor') return ['faculty'];
  return [];
};

const audienceLabel = (audience) => {
  if (!audience?.length) return '';
  return audience
    .map(a => ROLE_LABELS[a] || a)
    .join(', ');
};

module.exports = {
  ADMIN_ROLES,
  HOD_ROLES,
  ADMIN_AUDIENCE_MAP,
  HOD_AUDIENCE_MAP,
  resolveAudienceRoles,
  viewerAudienceTags,
  audienceLabel,
  ROLE_LABELS
};
