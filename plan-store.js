/* Browser-local confirmed-plan boundary. Kept as a classic script for file:// use. */
const RilloPlanStore = (() => {
  const VERSION = 3;
  const KEY = 'rillo-plan-v3';
  const collections = ['classes', 'registrations', 'deadlines', 'degrees', 'transfers'];
  const empty = () => ({ version: VERSION, classes: [], registrations: [], deadlines: [], degrees: [], transfers: [] });
  const invalid = (path, reason) => { throw new Error(`${path}: ${reason}`); };
  const object = (value, path) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(path, 'expected a record');
  };
  const text = (value, path) => { if (typeof value !== 'string') invalid(path, 'expected text'); };
  const required = (value, path) => {
    text(value, path);
    if (!value.trim()) invalid(path, 'must not be empty');
  };
  const choice = options => (value, path) => {
    if (!options.includes(value)) invalid(path, 'unrecognized value');
  };
  function date(value, path, withTime = false) {
    text(value, path);
    if (!value) return;
    const pattern = withTime ? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/ : /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = pattern.exec(value);
    if (!match) invalid(path, 'use a valid calendar date' + (withTime ? ' and local time' : ''));
    const [, y, m, d, h = '0', min = '0', sec = '0'] = match;
    const days = [31, (+y % 4 === 0 && (+y % 100 !== 0 || +y % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (+y < 1 || +m < 1 || +m > 12 || +d < 1 || +d > days[+m - 1] || +h > 23 || +min > 59 || +sec > 59) invalid(path, 'invalid calendar date or time');
  }
  const datetime = (value, path) => date(value, path, true);
  const time = (value, path) => {
    text(value, path);
    if (value && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) invalid(path, 'invalid meeting time');
  };
  const list = rule => (value, path) => {
    if (!Array.isArray(value)) invalid(path, 'expected a list');
    value.forEach((item, index) => rule(item, `${path}[${index}]`));
  };
  const units = (value, path) => {
    if (value === '') return;
    if (!['string', 'number'].includes(typeof value) || (typeof value === 'string' && !/^\d+(\.\d+)?$/.test(value)) || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 30) invalid(path, 'expected units between 0 and 30');
  };
  const common = { id: required, college: required, term: required, notes: text };
  const rules = {
    classes: { ...common, code: required, name: text, units, section: text, status: choice(['Planned', 'Registered', 'Waitlisted', 'In progress', 'Completed', 'Withdrawn']), professor: text, location: text, meetingDays: list(choice(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])), startTime: time, endTime: time, days: text, time: text, r40: text },
    registrations: { ...common, approval: choice(['Not started', 'Preparing', 'Waiting for signatures', 'Submitted', 'Approved', 'Needs correction']), registrationAt: datetime, formTarget: date, submittedOn: date, approvedCourses: text },
    deadlines: { ...common, title: required, at: datetime, leadDays: choice(['0', '1', '3', '7', '14', 0, 1, 3, 7, 14]), source: text },
    degrees: { id: required, name: required, type: choice(['AS-T', 'AA', 'AA-T', 'AS', 'Certificate']), college: required, year: required, source: text, requirements: list(required), notes: text },
    transfers: { id: required, university: required, major: required, source: text, notes: text }
  };
  const requiredFields = {
    classes: ['id', 'college', 'term', 'code', 'status'],
    registrations: ['id', 'college', 'term', 'approval'],
    deadlines: ['id', 'college', 'term', 'title', 'at'],
    degrees: ['id', 'college', 'name', 'type', 'year', 'requirements'],
    transfers: ['id', 'university', 'major']
  };
  function validate(plan) {
    object(plan, 'Plan');
    if (plan.version !== VERSION) invalid('Plan version', 'unsupported; choose a supported Rillo backup');
    for (const field of Object.keys(plan)) {
      if (field !== 'version' && !collections.includes(field)) invalid(field, 'unsupported plan field or relationship; use a compatible Rillo version');
    }
    for (const kind of collections) {
      if (!Array.isArray(plan[kind])) invalid(kind, 'expected a list');
      const ids = new Set();
      plan[kind].forEach((record, index) => {
        const path = `${kind}[${index}]`;
        object(record, path);
        for (const field of requiredFields[kind]) {
          if (!Object.hasOwn(record, field)) invalid(`${path}.${field}`, 'required field missing');
        }
        for (const [field, value] of Object.entries(record)) {
          const rule = rules[kind][field];
          if (!Object.hasOwn(rules[kind], field)) invalid(`${path}.${field}`, 'unsupported field or relationship; use a compatible Rillo version');
          rule(value, `${path}.${field}`);
        }
        if (ids.has(record.id)) invalid(`${path}.id`, 'duplicate identifier');
        ids.add(record.id);
        if (kind === 'classes') {
          if (record.meetingDays && new Set(record.meetingDays).size !== record.meetingDays.length) invalid(`${path}.meetingDays`, 'duplicate days');
          if (record.startTime && record.endTime && record.endTime <= record.startTime) invalid(`${path}.endTime`, 'must be after the start time');
        }
        if (kind === 'deadlines' && !record.at) invalid(`${path}.at`, 'date and time required');
      });
    }
    return plan;
  }
  function decode(raw, legacyVersion) {
    const value = JSON.parse(raw);
    object(value, 'Plan');
    const version = value.version === undefined ? legacyVersion : value.version;
    if (![1, 2, VERSION].includes(version)) invalid('Plan version', 'unsupported; choose a version 1, 2, or 3 Rillo backup');
    if (version === VERSION) return validate(value);
    const allowed = version === 1 ? ['version', 'classes', 'degrees'] : ['version', ...collections, 'legacyDegrees'];
    for (const field of Object.keys(value)) {
      if (!allowed.includes(field)) invalid(field, 'unsupported legacy field; original data has not been changed');
    }
    const requiredLists = version === 1 ? ['classes', 'degrees'] : ['classes', 'registrations', 'deadlines'];
    for (const field of requiredLists) {
      if (!Array.isArray(value[field])) invalid(field, 'expected a list');
    }
    if (Object.hasOwn(value, 'legacyDegrees') && !Array.isArray(value.legacyDegrees)) invalid('legacyDegrees', 'expected a list');
    for (const field of collections) {
      if (Object.hasOwn(value, field) && !Array.isArray(value[field])) invalid(field, 'expected a list');
    }
    // A previous release retained legacyDegrees alongside edited current goals.
    // Current records win for the same stable ID; retain legacy goals absent from the current list.
    validate({ ...empty(), degrees: value.legacyDegrees ?? [] });
    const degrees = [...(value.degrees ?? [])];
    for (const goal of value.legacyDegrees ?? []) {
      if (!degrees.some(current => current.id === goal.id)) degrees.push(goal);
    }
    const migrated = { ...empty(), ...value, version: VERSION, degrees };
    delete migrated.legacyDegrees;
    // Preserve legacy free-text schedules. They do not establish structured dates or form coverage.
    if (Array.isArray(migrated.classes)) migrated.classes = migrated.classes.map(c => ({ ...c, name: c.name ?? '', meetingDays: c.meetingDays ?? [] }));
    return validate(migrated);
  }
  function load() {
    for (const [key, legacyVersion] of [[KEY, undefined], ['rillo-plan-v2', 2], ['rillo-plan-v1', 1]]) {
      const raw = localStorage.getItem(key);
      if (raw !== null) return decode(raw, legacyVersion);
    }
    return empty();
  }
  function commit(candidate) {
    validate(candidate);
    // One atomic write; only publish to the UI after it succeeds. Legacy originals remain untouched.
    localStorage.setItem(KEY, JSON.stringify(candidate));
    return candidate;
  }
  return { empty, load, decode, commit };
})();
