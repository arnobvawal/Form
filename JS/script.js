{
    (function () {
  const form = document.getElementById('infoForm');
  const result = document.getElementById('result');
  const resultData = document.getElementById('resultData');
  const bio = document.getElementById('bio');
  const password = document.getElementById('password');
  const BIO_MAX = 300;

  bio.maxLength = BIO_MAX;
  const counter = document.createElement('div');
  counter.className = 'counter';
  bio.insertAdjacentElement('afterend', counter);
  const updateCounter = () => { counter.textContent = bio.value.length + ' / ' + BIO_MAX; };
  bio.addEventListener('input', updateCounter);
  updateCounter();

  const row = document.createElement('div');
  row.className = 'pw-row';
  password.parentNode.insertBefore(row, password);
  row.appendChild(password);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.textContent = 'Show';
  toggle.setAttribute('aria-label', 'Show or hide password');
  toggle.addEventListener('click', () => {
    const hidden = password.type === 'password';
    password.type = hidden ? 'text' : 'password';
    toggle.textContent = hidden ? 'Hide' : 'Show';
  });
  row.appendChild(toggle);

  const rules = {
    first: v => v.trim() ? '' : 'Enter your first name.',
    last: v => v.trim() ? '' : 'Enter your last name.',
    dob: v => {
      if (!v) return '';
      return new Date(v) > new Date() ? 'Date of birth cannot be in the future.' : '';
    },
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address.',
    phone: v => !v || /^\+?[0-9\s\-()]{7,16}$/.test(v) ? '' : 'Enter a valid phone number.',
    zip: v => !v || /^[A-Za-z0-9\s\-]{3,10}$/.test(v) ? '' : 'Enter a valid postal code.',
    website: v => {
      if (!v) return '';
      try { new URL(v); return ''; } catch { return 'Enter a full URL, like https://example.com.'; }
    },
    salary: v => !v || Number(v) >= 0 ? '' : 'Salary cannot be negative.',
    experience: v => !v || (Number(v) >= 0 && Number(v) <= 60) ? '' : 'Enter a number from 0 to 60.',
    linkedin: v => !v || /^https?:\/\/([a-z]+\.)?linkedin\.com\/.+/i.test(v) ? '' : 'Enter a LinkedIn profile URL.',
    emPhone: v => !v || /^\+?[0-9\s\-()]{7,16}$/.test(v) ? '' : 'Enter a valid phone number.',
    password: v =>
      v.length >= 8 && /[A-Za-z]/.test(v) && /[0-9]/.test(v)
        ? '' : 'Use at least 8 characters with a letter and a number.'
  };

  function showError(field, message) {
    let box = field.closest('.field').querySelector('.error-msg');
    if (!box) {
      box = document.createElement('div');
      box.className = 'error-msg';
      field.closest('.field').appendChild(box);
    }
    box.textContent = message;
    field.classList.toggle('invalid', Boolean(message));
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validateField(field) {
    const rule = rules[field.name];
    const message = rule ? rule(field.value) : '';
    showError(field, message);
    return !message;
  }

  Object.keys(rules).forEach(name => {
    const field = form.elements[name];
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('invalid')) validateField(field);
    });
  });

  form.addEventListener('submit', event => {
    event.preventDefault();

    let firstInvalid = null;
    Object.keys(rules).forEach(name => {
      const field = form.elements[name];
      if (!validateField(field) && !firstInvalid) firstInvalid = field;
    });

    const terms = form.elements.terms;
    showError(terms, terms.checked ? '' : 'You must accept the terms to continue.');
    if (!terms.checked && !firstInvalid) firstInvalid = terms;

    if (firstInvalid) {
      firstInvalid.focus();
      result.hidden = true;
      return;
    }

    const data = {};
    for (const [key, value] of new FormData(form).entries()) {
      if (key === 'password') continue;
      const val = value instanceof File ? value.name : value;
      data[key] = key in data ? [].concat(data[key], val) : val;
    }
    resultData.textContent = JSON.stringify(data, null, 2);
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  form.addEventListener('reset', () => {
    form.querySelectorAll('.invalid').forEach(el => {
      el.classList.remove('invalid');
      el.removeAttribute('aria-invalid');
    });
    form.querySelectorAll('.error-msg').forEach(el => { el.textContent = ''; });
    result.hidden = true;
    password.type = 'password';
    toggle.textContent = 'Show';

    setTimeout(() => {
      updateCounter();
      document.getElementById('skillOut').textContent = form.elements.skill.value;
    }, 0);
  });
})();
}

{
    (function () {
  const form = document.getElementById('infoForm');
  const KEY = 'infoFormDraft';
  const bar = document.getElementById('bar');
  const pct = document.getElementById('pct');
  const progress = document.getElementById('progress');
  const status = document.getElementById('saveStatus');
  const country = document.getElementById('country');
  const otherField = document.getElementById('otherCountryField');
  const photo = document.getElementById('photo');
  const preview = document.getElementById('photoPreview');
  let saveTimer;

  function updateProgress() {
    const groups = {};
    [...form.elements].forEach(el => {
      if (!el.name || el.type === 'range' || el.type === 'color' || el.type === 'button' ||
          el.type === 'submit' || el.type === 'reset' || el.closest('[hidden]')) return;
      const filled = el.type === 'checkbox' || el.type === 'radio' ? el.checked
        : el.type === 'file' ? el.files.length > 0 : el.value.trim() !== '';
      groups[el.name] = groups[el.name] || filled;
    });
    const names = Object.keys(groups);
    const done = names.filter(n => groups[n]).length;
    const value = names.length ? Math.round((done / names.length) * 100) : 0;
    bar.style.width = value + '%';
    pct.textContent = value + '%';
    progress.setAttribute('aria-valuenow', value);
  }

  function collect() {
    const data = {};
    for (const [key, value] of new FormData(form).entries()) {
      if (key === 'password' || value instanceof File) continue;
      (data[key] = data[key] || []).push(value);
    }
    return data;
  }

  function saveDraft() {
    try {
      localStorage.setItem(KEY, JSON.stringify(collect()));
      status.textContent = 'Draft saved';
    } catch (e) {
      status.textContent = '';
    }
  }

  function restoreDraft() {
    let draft = null;
    try { draft = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!draft) return;
    Object.entries(draft).forEach(([name, values]) => {
      const control = form.elements[name];
      if (!control) return;
      const list = control.tagName ? [control] : [...control];
      list.forEach(el => {
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = values.includes(el.value);
        else el.value = values[0];
      });
    });

    form.elements.bio.dispatchEvent(new Event('input'));
    form.elements.skill.dispatchEvent(new Event('input'));
    toggleOtherCountry();
    status.textContent = 'Draft restored';
  }

  function toggleOtherCountry() {
    otherField.hidden = country.value !== 'Other';
  }
  country.addEventListener('change', toggleOtherCountry);

  photo.addEventListener('change', () => {
    const file = photo.files[0];
    if (preview.src.startsWith('blob:')) URL.revokeObjectURL(preview.src);
    if (file && file.type.startsWith('image/')) {
      preview.src = URL.createObjectURL(file);
      preview.hidden = false;
    } else {
      preview.hidden = true;
    }
  });

  document.getElementById('downloadBtn').addEventListener('click', () => {
    const text = document.getElementById('resultData').textContent;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    link.download = 'form-data.json';
    link.click();
    URL.revokeObjectURL(link.href);
  });

  function onChange() {
    updateProgress();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 400);
  }
  form.addEventListener('input', onChange);
  form.addEventListener('change', onChange);

  form.addEventListener('reset', () => {
    try { localStorage.removeItem(KEY); } catch (e) {}
    clearTimeout(saveTimer);
    status.textContent = '';
    preview.hidden = true;
    setTimeout(() => { toggleOtherCountry(); updateProgress(); }, 0);
  });

  restoreDraft();
  updateProgress();
})();
}