// File: public/script.js
// script.js - Frontend for Student Registration System
// script.js part 1
// Fees mapped by classLevel key
let classFees = {
  "form1": 0,
  "form2": 0,
  "form3": 0,
  "form4": 0,
  "form5": 0,
  "lower-sixth": 0,
  "upper-sixth": 0,
};

// Pagination state
let currentPage = 1;
let pageSize = 100; // Increased default page size to 100
let totalCount = 0;

//My Utility Functions

  // Show notifications to user

function showNotification(message, type = "info", duration = 3000) {
    const notification = document.getElementById("notification");
    notification.textContent = message;

    // Remove any previous type classes
    notification.className = "notification";
    notification.classList.add(type);
    notification.classList.add("show");

    setTimeout(() => {
        notification.classList.remove("show");
    }, duration);
}
 

// Function to update the stats container numbers
function updateStats(students) {
    // Always compute stats based on active students only
    const activeStudents = (students || []).filter(s => (s.status || 'active') === 'active');
    const totalStudents = activeStudents.length;

    const completedFees = activeStudents.filter(student => {
        const requiredFees = classFees[student.classLevel] || 0;
        return student.feesPaid >= requiredFees;
    }).length;

    const owingFees = totalStudents - completedFees;

    // Update DOM
    document.getElementById('total-students').textContent = totalStudents;
    document.getElementById('completed-fees').textContent = completedFees;
    document.getElementById('owing-fees').textContent = owingFees;
}

// Format number as currency (FRS)
function formatCurrency(amount) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 });
}

// Format date as readable string
function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString();
}

// Calculate age from date of birth string
function calculateAge(dobStr) {
  const birthDate = new Date(dobStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Display-friendly names for classes
function getClassDisplayName(classKey) {
  const map = {
    "form1": "Form 1",
    "form2": "Form 2",
    "form3": "Form 3",
    "form4": "Form 4",
    "form5": "Form 5",
    "lower-sixth": "Lower Sixth",
    "upper-sixth": "Upper Sixth",
  };
  return map[classKey] || classKey;
}

// ===== I18N (lightweight) =====
const i18n = {
  en: {
    appTitle: 'Student Registration',
    appDescription: 'Complete student management solution with registration, fees tracking, and records management',
    licenseSectionTitle: 'License',
    licenseStatusText: 'Checking...',
    licenseExpiresText: '-',
    licenseKeyLabel: 'License Key',
    licenseKeyPlaceholder: 'Paste license key here',
    licenseStatusLabel: 'Status:',
    licenseExpiresLabel: 'Expires:',
    totalStudents: 'Total Students',
    completedFees: 'Fees Completed',
    owingFees: 'Fees Owing',
    classes: 'Classes',
    allClasses: 'All Classes',
    form1: 'Form 1',
    form2: 'Form 2',
    form3: 'Form 3',
    form4: 'Form 4',
    form5: 'Form 5',
    lowerSixth: 'Lower Sixth',
    upperSixth: 'Upper Sixth',
    allGenders: 'All Genders',
    male: 'Male',
    female: 'Female',
    age: 'Age',
    allFeeStatus: 'All Fee Status',
    completed: 'Completed',
    owing: 'Owing', 
    nameAsc: 'Name A → Z',
    nameDesc: 'Name Z → A',
    idAsc: 'ID ↑ (1 → N)',
    idDesc: 'ID ↓ (N → 1)',
    languageLabel: 'Language:',
    statusActive: 'Active',
    statusInactive: 'Inactive',
    statusAll: 'All',
    btnEdit: 'Edit',
    btnMarkInactive: 'Mark Inactive',
    btnReactivate: 'Reactivate',
    btnDelete: 'Delete',
    btnPrint: 'Print',
    badgeInactive: 'Inactive',
    searchPlaceholder: 'Search by name or matricule...',
    phSchoolName: "e.g. St. Joseph's High School",
    phSchoolCode: 'e.g., SJH',
    phAcademicYear: 'e.g., 2025 or 2024/2025',
    //registration form
    registerNewStudent: 'Register New Student',
    firstName: 'First Name *',
    lastName: 'Last Name *',
    gender: 'Gender *',
    dob: 'Date of Birth *',
    class: 'Class *',
    feesPaid: 'Fees Paid *',
    phone: 'Guardian Phone *',
    profilePic: 'Profile Picture *',
    male: 'Male',
    female: 'Female',
    selectClass: 'Select Class',
    // Placeholders
    phFirstName: 'Enter first name',
    phLastName: 'Enter last name',
    phFeesPaid: 'Enter amount paid',
    phPhone: 'Enter phone number',
    cardMatricule: 'Matricule',
    cardName: 'Name',
    cardGender: 'Gender',
    cardDob: 'Date of Birth',
    yearsOld: 'years old',
    cardClass: 'Class',
    cardRequiredFees: 'Required Fees',
    cardFeesPaid: 'Fees Paid',
    cardBalance: 'Balance',
    cardGuardianContact: 'Guardian Contact',
    printedOn: 'Printed on:',
    // School section
    schoolSectionTitle: 'School',
    labelSchoolName: 'Enter Your School Name',
    labelLogo: 'Logo',
    labelSchoolCode: 'School Code (e.g., SJH)',
    AcademicYear: 'Academic Year (e.g., 2025 or 2024/2025)',
    // License panel
    licenseManageBtn: 'Manage License',
    licenseStatusLabel: 'Status:',
    licenseExpiresLabel: 'Expires:',
    // Buttons (global UI)
    btnSearch: 'Search',
    btnPrintAll: 'Print All',
    btnSort: 'Sort',
    btnReset: 'Reset',
    btnAddStudent: 'Add Student',
    btnClearForm: 'Clear Form',
    btnSaveFees: 'Save Fees',
    saveSchoolBtn: 'Save School Name',
    regenerateMatriculesBtn: 'Regenerate Matricules',
    activateLicenseBtn: 'Activate License',
    deactivateLicenseBtn: 'Deactivate',
    // Notifications
    notifStudentsLoaded: 'Successfully loaded students',
    notifStudentsFound: 'Found {count} student(s)',
    notifErrorLoadingStudents: 'Error loading students',
    notifStudentAdded: 'Student added successfully',
    notifStudentUpdated: 'Student updated successfully',
    notifStudentDeleted: 'Student deleted',
    notifErrorDeletingStudent: 'Error deleting student',
    notifStudentReactivated: 'Student reactivated',
    notifStudentMarkedInactive: 'Student marked inactive',
    notifNoStudentsToPrint: 'No students to print.',
    notifClassFeesUpdated: 'Class fees updated!',
    notifErrorSavingClassFees: 'Error saving class fees',
    notifSchoolInfoSaved: 'School info saved!',
    notifErrorSavingSchoolInfo: 'Error saving school info',
    notifLicenseActivated: 'License activated',
    notifLicenseDeactivated: 'License deactivated',
    notifLicenseMissingOrExpired: 'License missing or expired. Please activate your license.',
    notifActivationFailed: 'License activation failed',
    notifMatriculesUpdated: 'Matricules updated for {count} student(s).',
    errorWithMessage: 'Error: {message}',
    emptyStateTitle: 'No Students Found',
    emptyStateSubtitle: 'Try adding some students or adjusting your search',
    setClassFees: 'Set Class Fees',
    footerText: 'Student Registration System 2025 All rights reserved | Developed for Educational Institutions, by Meriki Jubert',
    bannerMissingExpiredHtml: 'License missing or expired. Please activate to continue. For assistance, contact <strong>{name}</strong> at <a href="mailto:{email}">{email}</a> or <a href="tel:{phone}">{phone}</a>.',
    bannerExpiresSoon: 'License expires in {days} day(s) on {date}',
    department: 'Department',
    arts: 'Arts',
    science: 'Science',
    series: 'Series',
    allDepartments: 'All Departments',
    allSeries: 'All Series',
    notifStudentsFound: 'Found {count} student(s)',
  },
  fr: {
    appTitle: 'Inscription des Élèves',
    appDescription: 'Solution complète de gestion des élèves avec inscription, suivi des frais et gestion des enregistrements',
    licenseSectionTitle: 'Licence',
    licenseStatusText: 'Checking...',
    licenseExpiresText: '-',
    licenseKeyLabel: 'Clé de licence',
    licenseKeyPlaceholder: 'Coller la clé de licence ici',
    licenseStatusLabel: 'Statut:',
    licenseExpiresLabel: 'Expire le:',
    totalStudents: 'Total des élèves',
    completedFees: 'Frais payés',
    owingFees: 'Frais à payer',
    classes: 'Classes',
    allClasses: 'Toutes les classes',
    form1: 'Forme 1',
    form2: 'Forme 2',
    form3: 'Forme 3',
    form4: 'Forme 4',
    form5: 'Forme 5',
    lowerSixth: 'Lower Sixth',
    upperSixth: 'Upper Sixth',
    allGenders: 'Tous les genres',
    male: 'Masculin',
    female: 'Feminin',
    age: 'Age',
    allFeeStatus: 'Tous les statuts de frais',
    completed: 'Completé',
    owing: 'A payer',
    nameAsc: 'Nom A → Z',
    nameDesc: 'Nom Z → A',
    idAsc: 'ID ↑ (1 → N)',
    idDesc: 'ID ↓ (N → 1)',
    languageLabel: 'Langue :',
    statusActive: 'Actif',
    statusInactive: 'Inactif',
    statusAll: 'Tous',
    btnEdit: 'Modifier',
    btnMarkInactive: 'Marquer inactif',
    btnReactivate: 'Réactiver',
    btnDelete: 'Supprimer',
    btnPrint: 'Imprimer',
    badgeInactive: 'Inactif',
    searchPlaceholder: 'Rechercher par nom ou matricule...',
    phSchoolName: 'ex. Lycée St. Joseph',
    phSchoolCode: 'ex., SJH',
    phAcademicYear: 'ex., 2025 ou 2024/2025',
    //registration form
    registerNewStudent: 'Inscrire un nouvel élève',
    firstName: 'Prénom *',
    lastName: 'Nom *',
    gender: 'Sexe *',
    dob: 'Date de naissance *',
    class: 'Classe *',
    feesPaid: 'Frais payés *',
    phone: 'Téléphone du tuteur *',
    profilePic: 'Photo de profil *',
    male: 'Masculin',
    female: 'Féminin',
    selectClass: 'Sélectionner la classe',
    phFirstName: 'Entrez le prénom',
    phLastName: 'Entrez le nom',
    phFeesPaid: 'Saisir le montant payé',
    phPhone: 'Entrez le numéro de téléphone',
    cardMatricule: 'Matricule',
    cardName: 'Nom',
    cardGender: 'Sexe',
    cardDob: 'Date de naissance',
    yearsOld: 'ans',
    cardClass: 'Classe',
    cardRequiredFees: 'Frais requis',
    cardFeesPaid: 'Frais payés',
    cardBalance: 'Solde',
    cardGuardianContact: 'Contact du tuteur',
    printedOn: 'Imprimé le :',
    // Section École
    schoolSectionTitle: 'École',
    labelSchoolName: 'Entrez le nom de votre école',
    labelLogo: 'Logo',
    labelSchoolCode: 'Code de l’école (ex. SJH)',
    AcademicYear: 'Année Académique (ex. 2025 ou 2024/2025)',
    // Panneau de licence
    licenseManageBtn: 'Gérer la licence',
    licenseStatusLabel: 'Statut :',
    licenseExpiresLabel: 'Expire le :',
    // Boutons (UI globale)
    btnSearch: 'Rechercher',
    btnPrintAll: 'Tout imprimer',
    btnSort: 'Trier',
    btnReset: 'Réinitialiser',
    btnAddStudent: 'Ajouter un élève',
    btnClearForm: 'Effacer le formulaire',
    btnSaveFees: 'Enregistrer les frais',
    saveSchoolBtn: "Enregistrer le nom de l'école",
    regenerateMatriculesBtn: 'Régénérer les matricules',
    activateLicenseBtn: 'Activer la licence',
    deactivateLicenseBtn: 'Désactiver',
    // Notifications
    notifStudentsLoaded: 'Liste des élèves chargée avec succès',
    notifStudentsFound: '{count} élève(s) trouvé(s)',
    notifErrorLoadingStudents: 'Erreur lors du chargement des élèves',
    notifStudentAdded: "Élève ajouté avec succès",
    notifStudentUpdated: "Élève mis à jour avec succès",
    notifStudentDeleted: "Élève supprimé",
    notifErrorDeletingStudent: "Erreur lors de la suppression de l'élève",
    notifStudentReactivated: "Élève réactivé",
    notifStudentMarkedInactive: "Élève marqué inactif",
    notifNoStudentsToPrint: "Aucun élève à imprimer.",
    notifClassFeesUpdated: 'Frais de scolarité enregistrés !',
    notifErrorSavingClassFees: "Erreur lors de l'enregistrement des frais",
    notifSchoolInfoSaved: "Informations de l'école enregistrées !",
    notifErrorSavingSchoolInfo: "Erreur lors de l'enregistrement des informations de l'école",
    notifLicenseActivated: 'Licence activée',
    notifLicenseDeactivated: 'Licence désactivée',
    notifLicenseMissingOrExpired: 'Licence manquante ou expirée. Veuillez activer votre licence.',
    notifActivationFailed: "Échec de l'activation de la licence",
    notifMatriculesUpdated: 'Matricules mis à jour pour {count} élève(s).',
    errorWithMessage: 'Erreur : {message}',
    emptyStateTitle: 'Aucun élève trouvé',
    emptyStateSubtitle: 'Essayez d’ajouter des élèves ou d’ajuster votre recherche',
    setClassFees: 'Définir les frais de classe',
    footerText: 'Système d’inscription des élèves 2025 Tous droits réservés | Développé pour les établissements scolaires, par Meriki Jubert',
    bannerMissingExpiredHtml: 'Licence manquante ou expirée. Veuillez activer pour continuer. Pour assistance, contactez <strong>{name}</strong> à <a href="mailto:{email}">{email}</a> ou <a href="tel:{phone}">{phone}</a>.',
    bannerExpiresSoon: 'La licence expire dans {days} jour(s) le {date}',
    department: 'Département',
    arts: 'Arts',
    science: 'Sciences',
    series: 'Série',
    allDepartments: 'Tous les départements',
    allSeries: 'Toutes les séries',
  },
};

function getLang() {
  return localStorage.getItem('lang') || 'en';
}
function setLang(lang) {
  localStorage.setItem('lang', lang);
}
function t(key) {
  const lang = getLang();
  return (i18n[lang] && i18n[lang][key]) || i18n.en[key] || key;
}

function tf(key, params = {}) {
  let s = t(key);
  Object.keys(params).forEach(k => {
    s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
  });
  return s;
}

// Tauri-aware API base
const API_BASE = (typeof window !== 'undefined' && window.__TAURI__) ? 'http://127.0.0.1:4001' : '';
const apiUrl = (p) => `${API_BASE}${p}`;

function applyTranslations() {
  // Static elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    // Skip dynamic text containers that are populated by runtime data
    const dynamicIds = new Set(['license-status-text', 'license-expires-text', 'license-banner-text']);
    if (dynamicIds.has(el.id)) return;
    if (key) el.textContent = t(key);
  });
  // Inputs/placeholders
  const ph = [
    ['search-input', 'searchPlaceholder'],
    ['name', 'phSchoolName'],
    ['school-code', 'phSchoolCode'],
    ['academic-year', 'phAcademicYear'],
    ['firstName', 'phFirstName'],
    ['lastName', 'phLastName'],
    ['fees-paid', 'phFeesPaid'],
    ['phone', 'phPhone'],
  ];
  ph.forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el && 'placeholder' in el) el.placeholder = t(key);
  });
  // Status select options
  const statusSel = document.getElementById('search-status');
  if (statusSel) {
    const optMap = { active: 'statusActive', inactive: 'statusInactive', all: 'statusAll' };
    Array.from(statusSel.options).forEach(opt => {
      const key = optMap[opt.value];
      if (key) opt.textContent = t(key);
    });
  }
  // Department/Series first option text
  if (searchDepartment && searchDepartment.options.length) {
    searchDepartment.options[0].textContent = t('allDepartments');
  }
  if (searchSeries && searchSeries.options.length) {
    searchSeries.options[0].textContent = t('allSeries');
  }
  // Re-render students to update dynamic content
  renderStudents(filteredStudents.length ? filteredStudents : students);
}

// Hook up language selector
window.addEventListener('DOMContentLoaded', () => {
  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    langSelect.value = getLang();
    langSelect.addEventListener('change', () => {
      setLang(langSelect.value);
      applyTranslations();
      // Re-fetch license status so dynamic values (status, expiry, banner) are restored
      fetchLicenseStatus();
    });
  }
  applyTranslations();
});

// Ensure print reflects selected language
window.addEventListener('beforeprint', () => {
  applyTranslations();
});

// Theme management (light/dark)
(function () {
  const KEY = 'bl_theme';
  const prefersDark = () =>
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? ' Light' : ' Dark';
  }

  function initTheme() {
    const saved = localStorage.getItem(KEY);
    const theme = saved || (prefersDark() ? 'dark' : 'light');
    applyTheme(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(KEY, next);
    applyTheme(next);
  }

  function wireToggle() {
    const btn = document.getElementById('theme-toggle');
    if (btn && !btn.dataset._wired) {
      btn.addEventListener('click', toggleTheme);
      btn.dataset._wired = '1';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initTheme();
      wireToggle();
    });
  } else {
    initTheme();
    wireToggle();
  }

  // Follow system theme only if user hasn't chosen explicitly
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', (e) => {
      const saved = localStorage.getItem(KEY);
      if (!saved) applyTheme(e.matches ? 'dark' : 'light');
    });
  }
})();

// DOM References

const studentForm = document.getElementById('student-form');
const profilePicInput = document.getElementById('profile-pic');
const preview = document.getElementById('profilePicPreview');
const head = document.getElementById('school-logo');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');

const searchInput = document.getElementById('search-input');
const searchClass = document.getElementById('search-class');
const searchGender = document.getElementById('search-gender');
const searchAge = document.getElementById('search-age');
const searchFeeStatus = document.getElementById('search-fee-status');
const searchBtn = document.getElementById('search-btn');
const resetSearchBtn = document.getElementById('reset-search-btn');
const printAllBtn = document.getElementById('print-all-btn');
const sortBySelect = document.getElementById('sort-by');
const searchDepartment = document.getElementById('search-department');
const searchSeries = document.getElementById('search-series');
const sortBtn = document.getElementById('sort-btn');
const searchStatus = document.getElementById('search-status');

const classSelect = document.getElementById('class');
const deptGroup = document.getElementById('dept-group');
const seriesGroup = document.getElementById('series-group');
const departmentSelect = document.getElementById('department');
const seriesSelect = document.getElementById('series');

function updateDeptSeriesVisibility() {
  const val = classSelect ? classSelect.value : '';
  const isForm3 = val === 'form3';
  const isForm45 = val === 'form4' || val === 'form5';
  const isSixth = val === 'lower-sixth' || val === 'upper-sixth';
  const showDept = isForm3 || isForm45 || isSixth;
  const showSeries = isSixth; // Series only for sixth form

  // Show/hide department and series groups
  if (deptGroup) deptGroup.style.display = showDept ? '' : 'none';
  if (seriesGroup) seriesGroup.style.display = showSeries ? '' : 'none';

  // Clear fields when hidden
  if (!showDept && departmentSelect) departmentSelect.value = '';
  if (!showSeries && seriesSelect) seriesSelect.value = '';
  
  // Update department options based on class level
  updateDepartmentOptions(val);
  
  // Update series options if needed
  if (showSeries) updateSeriesOptions();
}

function updateDepartmentOptions(classLevel) {
  if (!departmentSelect) return;
  
  // Save current value to restore after updating options
  const currentValue = departmentSelect.value;
  
  // Clear existing options except the first one
  while (departmentSelect.options.length > 1) {
    departmentSelect.remove(1);
  }
  
  // Add appropriate options based on class level
  if (classLevel === 'form3') {
    // Only Commercial and General for Form 3
    addDepartmentOption('commercial', 'Commercial');
    addDepartmentOption('general', 'General');
  } else if (['form4', 'form5', 'lower-sixth', 'upper-sixth'].includes(classLevel)) {
    // Commercial, Arts, Science for Forms 4-5 and Sixth Form
    addDepartmentOption('commercial', 'Commercial');
    addDepartmentOption('arts', 'Arts');
    addDepartmentOption('science', 'Science');
  }
  
  // Restore previous value if it's still valid
  if (currentValue && Array.from(departmentSelect.options).some(opt => opt.value === currentValue)) {
    departmentSelect.value = currentValue;
  } else {
    departmentSelect.value = '';
  }
}

function addDepartmentOption(value, text) {
  if (!departmentSelect) return;
  const option = document.createElement('option');
  option.value = value;
  option.textContent = text;
  departmentSelect.appendChild(option);
}

function updateSeriesOptions() {
  if (!seriesSelect) return;
  const dept = (departmentSelect && departmentSelect.value) || '';
  const isArts = dept === 'arts';
  const isScience = dept === 'science';
  const isCommercial = dept === 'commercial';
  
  // Iterate options and toggle visibility based on department
  Array.from(seriesSelect.options).forEach((opt, idx) => {
    // Always keep the first placeholder option visible
    if (idx === 0) {
      opt.disabled = false;
      opt.hidden = false;
      opt.style.display = '';
      return;
    }
    
    const isArtsSeries = opt.classList.contains('arts-series');
    const isScienceSeries = opt.classList.contains('science-series');
    const isCommercialSeries = opt.classList.contains('commercial-series');
    
    let visible = false;
    if (isArts) {
      visible = isArtsSeries;
    } else if (isScience) {
      visible = isScienceSeries;
    } else if (isCommercial) {
      visible = isCommercialSeries;
    }
    
    // Show/hide the option
    opt.disabled = !visible;
    opt.hidden = !visible;
    opt.style.display = visible ? '' : 'none';
  });
  
  // If current value is not allowed, reset it
  const current = seriesSelect.value;
  if (current) {
    const currentOpt = Array.from(seriesSelect.options).find(o => o.value === current);
    if (!currentOpt || currentOpt.disabled) {
      seriesSelect.value = '';
    }
  }
}

if (classSelect) {
  classSelect.addEventListener('change', updateDeptSeriesVisibility);
  // initialize on load
  updateDeptSeriesVisibility();
}

// Update series options whenever department changes
if (departmentSelect) {
  departmentSelect.addEventListener('change', () => {
    updateSeriesOptions();
    // If class is not sixth, series is hidden; still clear out invalid selection
    const val = classSelect ? classSelect.value : '';
    const isSixth = val === 'lower-sixth' || val === 'upper-sixth';
    if (!isSixth && seriesSelect) seriesSelect.value = '';
  });
}

// State
let students = [];
let filteredStudents = [];
let lastActionWasSearch = false; // track if the last fetch was triggered by search

// Loader state (throttled to avoid flicker)
let loaderTimer = null;
let loaderVisible = false;

// Loader helpers (throttled show)
function showLoader(text = 'Loading...', delayMs = 150) {
  // clear any pending timer
  if (loaderTimer) clearTimeout(loaderTimer);
  loaderTimer = setTimeout(() => {
    if (loaderText) loaderText.textContent = text;
    if (loader) loader.classList.remove('hidden');
    loaderVisible = true;
  }, Math.max(0, delayMs));
}
function hideLoader() {
  if (loaderTimer) {
    clearTimeout(loaderTimer);
    loaderTimer = null;
  }
  if (loaderVisible && loader) {
    loader.classList.add('hidden');
  }
  loaderVisible = false;
}

// Button-level spinner helpers
function setButtonLoading(btn, isLoading, textWhileLoading = null) {
  if (!btn) return;
  if (isLoading) {
    btn.classList.add('loading');
    // preserve original label
    if (!btn.dataset.label) btn.dataset.label = btn.innerHTML;
    if (textWhileLoading) {
      // keep existing icon if present, then text
      const hasIcon = btn.querySelector('i');
      btn.innerHTML = `${hasIcon ? btn.innerHTML : ''} ${textWhileLoading} <span class="btn-spinner"></span>`;
    } else if (!btn.querySelector('.btn-spinner')) {
      btn.insertAdjacentHTML('beforeend', '<span class="btn-spinner"></span>');
    }
  } else {
    btn.classList.remove('loading');
    if (btn.dataset.label) {
      btn.innerHTML = btn.dataset.label;
      delete btn.dataset.label;
    } else {
      const sp = btn.querySelector('.btn-spinner');
      if (sp) sp.remove();
    }
  }
}

// Fetch Students from Backend (server-side pagination + filters)

// Pagination UI elements
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageInfoEl = document.getElementById('pageInfo');
const totalInfoEl = document.getElementById('totalInfo');

function updatePaginationUI() {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (pageInfoEl) pageInfoEl.textContent = `Page ${currentPage} / ${totalPages}`;
  if (totalInfoEl) totalInfoEl.textContent = totalCount ? `Total: ${totalCount}` : '';
  if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
  if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
}

async function fetchStudents() {
  showLoader(t('loading'));
  try {
    const statusSel = (searchStatus && searchStatus.value) || 'active';
    const params = new URLSearchParams();
    params.set('page', String(currentPage));
    params.set('pageSize', String(pageSize));

    // Get all search input values at the start of the function
    const searchQuery = searchInput?.value.trim() || '';
    const ageSearchEl = document.getElementById('search-age');
    const feesStatusEl = document.getElementById('search-fee-status');
    const ageSearch = ageSearchEl ? ageSearchEl.value.trim() : '';
    const feesStatus = feesStatusEl ? feesStatusEl.value.trim() : '';
    
    // Log all parameters for debugging
    const logParams = {
      page: currentPage,
      pageSize: pageSize,
      statusSel: statusSel,
      searchQuery: searchQuery,
      ageSearch: ageSearch,
      feesStatus: feesStatus,
      classLevel: searchClass?.value || '',
      gender: searchGender?.value || '',
      department: searchDepartment?.value || '',
      series: searchSeries?.value || ''
    };
    
    console.log('Fetching students with params:', logParams);

    // status/includeInactive
    if (statusSel === 'all') {
      params.set('includeInactive', 'true');
    } else if (statusSel === 'inactive') {
      params.set('status', 'inactive');
    }

    // Text search (name or matricule)
    if (searchQuery) {
      params.set('q', searchQuery);
    }

    // Age search (exact match)
    if (ageSearch) params.set('age', ageSearch);

    // Other filters
    if (searchClass?.value) params.set('classLevel', searchClass.value);
    if (searchGender?.value) params.set('gender', searchGender.value);
    if (searchDepartment?.value) params.set('department', searchDepartment.value);
    if (searchSeries?.value) params.set('series', searchSeries.value);

    const url = apiUrl(`/api/students?${params.toString()}`);
    console.log('API Request URL:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', { status: response.status, statusText: response.statusText, errorText });
      throw new Error('Failed to fetch students');
    }
    
    const responseData = await response.json();
    console.log('API Response:', responseData);
    
    // Extract the array of students from the response
    // The response could be either an array directly or an object with a data property
    let students = Array.isArray(responseData) ? responseData : (responseData.data || []);
    const totalCount = responseData.total || students.length;
    
    console.log(`Processing ${students.length} students from API, total: ${totalCount}`);
    
    // Apply fees status filter on the frontend if needed
    if (feesStatus) {
      students = students.filter(student => {
        const requiredFees = classFees[student.classLevel] || 0;
        const feesPaid = student.feesPaid || 0;
        
        if (feesStatus === 'completed') {
          return feesPaid >= requiredFees;
        } else if (feesStatus === 'owing') {
          return feesPaid < requiredFees;
        }
        return true;
      });
      
      console.log(`Filtered to ${students.length} students by fees status: ${feesStatus}`);
    }
    
    // Debug: Log the raw response data
    console.log('Raw API response data:', responseData);
    
    // Ensure students is an array
    if (!Array.isArray(students)) {
      console.error('Expected students to be an array, got:', typeof students);
      students = [];
    }
    
    // Update the global variables
    filteredStudents = students;
    const filteredCount = students.length;
    console.log(`Processing ${filteredCount} students for rendering`);
    
    // Debug: Log first few students
    if (students.length > 0) {
      console.log('Sample student data:', students.slice(0, 3).map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        classLevel: s.classLevel,
        feesPaid: s.feesPaid,
        hasProfilePic: !!s.profilePic
      })));
    }
    
    // Force a reflow to ensure DOM is ready
    setTimeout(() => {
      renderStudents(filteredStudents);
      updateStats(filteredStudents);
      updatePaginationUI();
      
      // Show appropriate notification with filtered count
      if (lastActionWasSearch) {
        showNotification(tf('notifStudentsFound', { count: filteredCount }), 'info');
      } else {
        showNotification(t('notifStudentsLoaded'), 'info');
      }
      
      // Reset the search flag after showing the notification
      lastActionWasSearch = false;
    }, 0);
  } catch (error) {
    showNotification(t('notifErrorLoadingStudents'), 'error');
  } finally {
    hideLoader();
  }
}

// Render Student Cards List

function renderStudents(studentList) {
  console.log('Rendering students list:', studentList);
  const appGrid = document.getElementById('appGrid');
  if (!appGrid) {
    console.error('appGrid element not found!');
    return;
  }
  
  // Remove all student cards (but keep the form as the first child)
  while (appGrid.children.length > 1) {
    appGrid.removeChild(appGrid.lastChild);
  }

  if (studentList.length === 0) {
    // Show empty state as a grid item
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.innerHTML = `
      <i class="fas fa-user-graduate fa-3x" style="color: #ccc; margin-bottom: 20px;"></i>
      <h3>${t('emptyStateTitle')}</h3>
      <p>${t('emptyStateSubtitle')}</p>
    `;
    appGrid.appendChild(emptyDiv);
    return;
  }

  // Add each student card as a grid item after the form
  studentList.forEach(student => {
    try {
      console.log('Rendering student:', student.id, student.firstName, student.lastName);
      const cardHtml = renderStudentCard(student);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = cardHtml.trim();
      const cardElement = tempDiv.firstChild;
      
      if (cardElement) {
        appGrid.appendChild(cardElement);
      } else {
        console.error('Failed to create card element for student:', student.id);
      }
    } catch (error) {
      console.error('Error rendering student card:', error, student);
    }
  });

  // Only attach event listeners if we successfully rendered cards
  if (studentList.length > 0) {
    try {
      attachCardEventListeners();
    } catch (error) {
      console.error('Error attaching event listeners:', error);
    }
  }
}

function renderStudentCard(student) {
  // showNotification('Student added successfully', 'info');
  const classValue = student.classLevel;
  const requiredFees = classFees[classValue] || 0;
  const balance = requiredFees - student.feesPaid;
  const feesStatus = balance > 0
    ? `<div class="fees-status status-owing">Still Owing: ${formatCurrency(balance)}</div>`
    : `<div class="fees-status status-completed">Completed</div>`;
  const age = calculateAge(student.dob);
  const phone = (student.phone && String(student.phone).trim()) ? student.phone : 'N/A';

  const avatarStatusClass = balance > 0 ? 'avatar-owing' : 'avatar-completed';
  const isInactive = (student.status || 'active') !== 'active';
  const inactiveBadge = isInactive ? `<span class="badge-inactive" title="${t('badgeInactive')}">${t('badgeInactive')}</span>` : '';
  const cardInactiveClass = isInactive ? 'inactive' : '';
  const actionButtons = studentCardActionsHtml(isInactive);

  const picUrl = student.profilePic
    ? (student.profilePic.startsWith('http') ? student.profilePic : apiUrl(student.profilePic))
    : '';

  return `
    <div class="student-card ${cardInactiveClass}" data-id="${student.id}">
      <div class="student-header">
        <div class="student-avatar ${avatarStatusClass}">
          ${student.profilePic ? `<img src="${picUrl}" alt="${student.firstName}">` : `<i class="fas fa-user"></i>`}
        </div>
        <div class="student-name">${student.firstName} ${student.lastName} ${inactiveBadge}</div>
      </div>
      <div class="student-details">
        <p><strong>${t('cardMatricule')}:</strong> ${student.matricule || student.id}</p>
        <p><strong>${t('cardName')}:</strong> ${student.firstName} ${student.lastName}</p>
        <p><strong>${t('cardGender')}:</strong> ${student.gender}</p>
        <p><strong>${t('cardDob')}:</strong> ${formatDate(student.dob)} (${age} ${t('yearsOld')})</p>
        <p><strong>${t('cardClass')}:</strong> ${getClassDisplayName(classValue)}</p>
        ${student.department ? `<p><strong>${t('department')}:</strong> ${t(student.department) || student.department}</p>` : ''}
        ${student.series ? `<p><strong>${t('series')}:</strong> ${student.series}</p>` : ''}
        <p><strong>${t('cardRequiredFees')}:</strong> ${formatCurrency(requiredFees)}</p>
        <p><strong>${t('cardFeesPaid')}:</strong> ${formatCurrency(student.feesPaid)} | <strong>${t('cardBalance')}:</strong> ${formatCurrency(balance)}</p>
        <p><strong>${t('cardGuardianContact')}:</strong> ${phone}</p>
        ${feesStatus}
      </div>
      <div class="student-actions">
        ${actionButtons}
      </div>
    </div>
  `;
}

// Use event delegation for dynamic elements
function attachCardEventListeners() {
  const appGrid = document.getElementById('appGrid');
  if (!appGrid) return;

  // Single event listener for all card actions
  appGrid.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-btn');
    const deleteBtn = e.target.closest('.delete-btn');
    const printBtn = e.target.closest('.print-btn');
    const inactivateBtn = e.target.closest('.inactivate-btn');
    const reactivateBtn = e.target.closest('.reactivate-btn');

    if (editBtn) onEditStudent(e);
    else if (deleteBtn) onDeleteStudent(e);
    else if (printBtn) onPrintSingleStudent(e);
    else if (inactivateBtn) onInactivateStudent(e);
    else if (reactivateBtn) onReactivateStudent(e);
  });
}

async function onPrintSingleStudent(e) {
  try {
    const card = e.target.closest('.student-card');
    if (!card) return;
    
    const studentId = card.dataset.id;
    if (!studentId) {
      console.error('No student ID found on card');
      return;
    }

    // Try to get student from filteredStudents first, then fetch if not found
    let student = filteredStudents?.find(s => s.id == studentId);
    
    if (!student) {
      // If not in filtered list, try to fetch the student data
      showLoader('Loading student data...');
      try {
        const response = await fetch(apiUrl(`/api/students/${studentId}`));
        if (!response.ok) throw new Error('Failed to fetch student data');
        student = await response.json();
      } catch (error) {
        console.error('Error fetching student:', error);
        showNotification(t('errorLoadingStudent'), 'error');
        return;
      } finally {
        hideLoader();
      }
    }

    if (!student) {
      console.error('Student not found');
      return;
    }

    // Call print function with the student data
    printStudent(student);
  } catch (error) {
    console.error('Error in onPrintSingleStudent:', error);
    showNotification(t('errorLoadingStudent'), 'error');
  }
}

// Print student in card style with picture and fees info
function printStudent(student) {
  const printWindow = window.open('', '_blank');
  const classValue = student.classLevel;
  const requiredFees = classFees[classValue] || 0;
  const balance = requiredFees - student.feesPaid;
  const feesStatus = balance > 0
    ? `<div class="fees-status status-owing">Still Owing: ${formatCurrency(balance)}</div>`
    : `<div class="fees-status status-completed">Completed</div>`;
  const age = calculateAge(student.dob);
  const phone = (student.phone && String(student.phone).trim()) ? student.phone : 'N/A';

  // Use dynamic school name
  const schoolName = schoolInfo && schoolInfo.name ? schoolInfo.name : 'School Name';

  // Add print time
  const now = new Date();
  const printTime = now.toLocaleString();

  const content = `
  <html>
  <head>
    <title>Receipt for ${student.firstName} ${student.lastName}</title>
    <style>
      body { font-family: Arial, sans-serif; }
      .student-card { border: 1px solid #ccc; padding: 15px; border-radius: 5px; max-width: 400px; }
      .student-avatar img { width: 80px; height: 80px; border-radius: 50%; margin-bottom: 10px; }
      .fees-status { font-weight: bold; margin-top: 10px; padding: 5px; border-radius: 3px; display: inline-block; }
      .status-owing { background-color:rgb(244, 149, 7); color:rgb(0, 0, 0); }
      .status-completed { background-color: #d4edda; color: #155724; }
    </style>
  </head>
  <body>
    <div style="display:flex;align-items:center;gap:10px;">
      <h1>${schoolName}</h1>
      <img src="${schoolInfo.logo}" alt="${schoolInfo.name} Logo" style="width: 50px; height: 50px;">
    </div>
    <h2>Student Information</h2>
    <div class="student-card">
      <div class="student-avatar">
        ${student.profilePic ? `<img src="${apiUrl(student.profilePic)}" alt="${student.firstName}">` : `<i class="fas fa-user" style="font-size: 80px;"></i>`}
      </div>
      <p><strong>${t('cardMatricule')}:</strong> ${student.matricule || student.id}</p>
      <p><strong>${t('cardName')}:</strong> ${student.firstName} ${student.lastName}</p>
      <p><strong>${t('cardGender')}:</strong> ${student.gender}</p>
      <p><strong>${t('cardDob')}:</strong> ${formatDate(student.dob)} (${age} ${t('yearsOld')})</p>
      <p><strong>${t('cardClass')}:</strong> ${getClassDisplayName(classValue)}</p>
      ${student.department ? `<p><strong>${t('department')}:</strong> ${t(student.department) || student.department}</p>` : ''}
      ${student.series ? `<p><strong>${t('series')}:</strong> ${student.series}</p>` : ''}
      <p><strong>${t('cardRequiredFees')}:</strong> ${formatCurrency(requiredFees)}</p>
      <p><strong>${t('cardFeesPaid')}:</strong> ${formatCurrency(student.feesPaid)}</p>
      <p><strong>${t('cardGuardianContact')}:</strong> ${phone}</p>
      ${feesStatus}
      <hr>
      <p><strong>${t('printedOn')}</strong> ${printTime}</p>
    </div>
  </body>
  </html>`;
  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.print();
}

// Handle Student Form Submission (Add or Update)
// Define the studentForm variable




// Add event listener to studentForm
studentForm.addEventListener('submit', async (e) => {
  if (!ensureLicenseActiveOrWarn()) return;
  e.preventDefault();

  // Refresh students list to ensure we have the latest data before checking for duplicates
  await fetchStudents();

  // Get form values directly instead of using FormData initially
  const firstName = studentForm.firstName.value.trim();
  const lastName = studentForm.lastName.value.trim();
  const dob = studentForm.dob.value.trim();
  const gender = studentForm.gender.value;
  const classLevel = studentForm.classLevel.value;
  const feesPaid = Number(studentForm.feesPaid.value);
  const phone = studentForm.phone.value.trim();
  
  const age = calculateAge(dob);
  if (age < 3) {
    showNotification('Student must be at least 3 years old.', 'error');
    return;
  }

  // Check if student already exists
  const id = studentForm.dataset.editingId;
  const existingStudent = students.find(student => {
    if (id && student.id == id) {
      return false;
    }
    return (
      student.firstName === firstName &&
      student.lastName === lastName &&
      student.dob === dob
    );
  });

  if (existingStudent) {
    showNotification('Student already exists.', 'error');
    return;
  }

  const requiredFees = classFees[classLevel] || 0;

  if (feesPaid < 0) {
    showNotification('Fees paid cannot be negative.', 'error');
    return;
  }
  if (feesPaid > requiredFees) {
    showNotification('Fees paid cannot exceed required fees.', 'error');
    return;
  }

  try {
    showLoader(id ? t('loading') : t('loading'));
    const submitBtn = document.getElementById('subbut');
    setButtonLoading(submitBtn, true, id ? t('btnEdit') : t('btnAddStudent'));
    // Create FormData object and append fields explicitly
    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('dob', dob);
    formData.append('gender', gender);
    formData.append('classLevel', classLevel);
    formData.append('feesPaid', feesPaid);
    formData.append('phone', phone);
    // Also include Department and Series if available
    const deptVal = (typeof departmentSelect !== 'undefined' && departmentSelect) ? (departmentSelect.value || '') : '';
    const seriesVal = (typeof seriesSelect !== 'undefined' && seriesSelect) ? (seriesSelect.value || '') : '';
    formData.append('department', deptVal);
    formData.append('series', seriesVal);
    
    let response;
    if (id) {
      // Update existing student
      const existingPic = document.getElementById('existingPic').value;
      const fileInput = studentForm.querySelector('input[name="profilePic"]');
      
      // For updates, we need to handle the file input specially
      if (fileInput.files[0]) {
        // If a new file is selected, append it
        formData.append('profilePic', fileInput.files[0]);
      } else if (existingPic) {
        // If no new file but there's an existing one, we still need to send the existing path
        // But we don't append it to formData as it's not a file, just send it as a regular field
        formData.append('existingPic', existingPic);
      }
      
      response = await fetch(apiUrl(`/api/students/${id}`), {
        method: 'PUT',
        body: formData,
      });
    } else {
      // Add new student
      const fileInput = studentForm.querySelector('input[name="profilePic"]');
      if (fileInput.files[0]) {
        formData.append('profilePic', fileInput.files[0]);
      }
      
      response = await fetch(apiUrl('/api/students'), {
        method: 'POST',
        body: formData,
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.error) {
        throw new Error(errorData.error);
      } else {
        throw new Error('Server error');
      }
    }

    const result = await response.json();

    // Refresh student list after operation
    await fetchStudents();
    resetForm();

    showNotification(id ? t('notifStudentUpdated') : t('notifStudentAdded'), 'success');
    updateStats(students); // Pass students here!
  } catch (error) {
    showNotification(tf('errorWithMessage', { message: error.message }), 'error');
  } finally {
    hideLoader();
    const submitBtn = document.getElementById('subbut');
    setButtonLoading(submitBtn, false);
  }
});

// Reset Form to blank state

function resetForm() {
  studentForm.reset();
  delete studentForm.dataset.editingId;
  const preview = document.getElementById('profilePicPreview');
  preview.src = '';
  preview.style.display = 'none';
}

// Add event listener for profile picture preview
document.getElementById('profile-pic').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const preview = document.getElementById('profilePicPreview');
  
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      preview.src = event.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    // If no file selected, hide preview
    preview.style.display = 'none';
  }
});

document.getElementById('clear-btn').addEventListener('click', function() {
  resetForm();
});

// script.js part 2
// Edit Student - populate form with existing data

async function onEditStudent(e) {
  try {
    const card = e.target.closest('.student-card');
    if (!card) return;
    
    const studentId = card.dataset.id;
    if (!studentId) {
      console.error('No student ID found on card');
      return;
    }

    // Try to get student from filteredStudents first, then fetch if not found
    let student = filteredStudents?.find(s => s.id == studentId);
    
    if (!student) {
      // If not in filtered list, try to fetch the student data
      showLoader('Loading student data...');
      try {
        const response = await fetch(apiUrl(`/api/students/${studentId}`));
        if (!response.ok) throw new Error('Failed to fetch student data');
        student = await response.json();
      } catch (error) {
        console.error('Error fetching student:', error);
        showNotification(t('errorLoadingStudent'), 'error');
        return;
      } finally {
        hideLoader();
      }
    }

    if (!student) {
      console.error('Student not found');
      return;
    }

    // Set form values
    document.getElementById('existingPic').value = student.profilePic || '';
    
    const preview = document.getElementById('profilePicPreview');
    if (student.profilePic) {
      preview.src = apiUrl(student.profilePic);
      preview.style.display = 'block';
    } else {
      preview.src = '';
      preview.style.display = 'none';
    }

    // Populate form fields
    studentForm.dataset.editingId = studentId;
    studentForm.firstName.value = student.firstName || '';
    studentForm.lastName.value = student.lastName || '';
    studentForm.dob.value = student.dob || '';
    studentForm.gender.value = student.gender || '';
    
    // Set class level and update department/series visibility
    studentForm.classLevel.value = student.classLevel || '';
    
    // Small delay to ensure the DOM updates
    setTimeout(() => {
      if (departmentSelect) {
        departmentSelect.value = student.department || '';
        updateDeptSeriesVisibility();
        
        // Another small delay to ensure department change is processed
        setTimeout(() => {
          if (seriesSelect) {
            seriesSelect.value = student.series || '';
          }
        }, 50);
      }
      
      studentForm.feesPaid.value = student.feesPaid || '';
      studentForm.phone.value = student.phone || '';
      
      // Scroll to form
      document.querySelector('.form-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    
  } catch (error) {
    console.error('Error in onEditStudent:', error);
    showNotification(t('errorLoadingStudent'), 'error');
  }
}

// Delete Student with confirmation

async function onDeleteStudent(e) {
  if (!ensureLicenseActiveOrWarn()) return;
  const btn = e.currentTarget;
  const card = e.target.closest('.student-card');
  if (!card) return;
  const id = card.dataset.id;
  if (!id) return;
  if (!confirm('Are you sure you want to delete this student?')) return;

  showLoader(t('loading'));
  setButtonLoading(btn, true, t('btnDelete'));
  try {
    const res = await fetch(apiUrl(`/api/students/${id}`), { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    
    await fetchStudents();
    showNotification(t('notifStudentDeleted'), 'success');
  } catch (err) {
    showNotification(t('notifErrorDeletingStudent'), 'error');
  } finally {
    hideLoader();
    setButtonLoading(btn, false);
  }
}

// Mark student inactive
async function onInactivateStudent(e) {
  if (!ensureLicenseActiveOrWarn()) return;
  const btn = e.currentTarget;
  const card = btn.closest('.student-card');
  if (!card) return;
  const id = card.dataset.id;
  if (!id) return;
  if (!confirm('Mark this student as inactive?')) return;
  showLoader(t('loading'));
  setButtonLoading(btn, true, t('btnMarkInactive'));
  try {
    const res = await fetch(apiUrl(`/api/students/${id}/inactivate`), { method: 'PUT' });
    if (!res.ok) throw new Error('Failed to inactivate');
    await fetchStudents();
    showNotification(t('notifStudentMarkedInactive'), 'success');
  } catch (err) {
    showNotification(tf('errorWithMessage', { message: err.message }), 'error');
  } finally {
    hideLoader();
    setButtonLoading(btn, false);
  }
}

// Reactivate student
async function onReactivateStudent(e) {
  if (!ensureLicenseActiveOrWarn()) return;
  const btn = e.currentTarget;
  const card = btn.closest('.student-card');
  if (!card) return;
  const id = card.dataset.id;
  if (!id) return;
  showLoader(t('loading'));
  setButtonLoading(btn, true, t('btnReactivate'));
  try {
    const res = await fetch(apiUrl(`/api/students/${id}/reactivate`), { method: 'PUT' });
    if (!res.ok) throw new Error('Failed to reactivate');
    await fetchStudents();
    showNotification(t('notifStudentReactivated'), 'success');
  } catch (err) {
    showNotification(tf('errorWithMessage', { message: err.message }), 'error');
  } finally {
    hideLoader();
    setButtonLoading(btn, false);
  }
}

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Search Logic - filter students based on search criteria

// Refresh list when status filter changes (Active/Inactive/All)
if (searchStatus) {
  searchStatus.addEventListener('change', () => {
    currentPage = 1;
    lastActionWasSearch = true;
    fetchStudents();
  });
}

// Handle search button click
searchBtn.addEventListener('click', () => {
  currentPage = 1;
  lastActionWasSearch = true;
  fetchStudents();
});

// Debounced search handler for text input
const handleSearch = debounce(() => {
  currentPage = 1;
  lastActionWasSearch = true;
  fetchStudents();
}, 500);

// Handle search input events
if (searchInput) {
  // Handle Enter key
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      currentPage = 1;
      lastActionWasSearch = true;
      fetchStudents();
    }
  });
  
  // Handle input with debounce
  searchInput.addEventListener('input', handleSearch);
}

// Handle age search input
const ageSearchInput = document.getElementById('search-age');
if (ageSearchInput) {
  ageSearchInput.addEventListener('input', debounce(() => {
    console.log('Age input changed:', ageSearchInput.value);
    currentPage = 1;
    lastActionWasSearch = true;
    fetchStudents();
  }, 500));

  ageSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      console.log('Age search with Enter:', ageSearchInput.value);
      currentPage = 1;
      lastActionWasSearch = true;
      fetchStudents();
    }
  });
}

// Handle fee status change
const feesStatusSelect = document.getElementById('search-fee-status');
if (feesStatusSelect) {
  feesStatusSelect.addEventListener('change', (e) => {
    console.log('Fees status changed:', e.target.value);
    currentPage = 1;
    lastActionWasSearch = true;
    fetchStudents();
  });
}

// Handle class, gender, department, and series changes
[searchClass, searchGender, searchDepartment, searchSeries].forEach(select => {
  if (select) {
    select.addEventListener('change', () => {
      currentPage = 1;
      lastActionWasSearch = true;
      fetchStudents();
    });
  }
});

// Reset Search Filters and Show All Students
resetSearchBtn.addEventListener('click', () => {
  // Clear all search inputs
  if (searchInput) searchInput.value = '';
  if (searchClass) searchClass.value = '';
  if (searchGender) searchGender.value = '';
  
  // Clear age search
  const ageSearchInput = document.getElementById('search-age');
  if (ageSearchInput) ageSearchInput.value = '';
  
  // Clear fees status
  const feesStatusSelect = document.getElementById('search-fee-status');
  if (feesStatusSelect) feesStatusSelect.value = '';
  
  // Reset other filters
  if (searchStatus) searchStatus.value = 'active';
  if (searchDepartment) searchDepartment.value = '';
  if (searchSeries) searchSeries.value = '';
  
  // Reset pagination and fetch
  currentPage = 1;
  lastActionWasSearch = false;
  fetchStudents();
  
  // Show notification
  showNotification(t('notifSearchReset'), 'info');
});

// Pagination buttons
if (prevPageBtn) {
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      fetchStudents();
    }
  });
}
if (nextPageBtn) {
  nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    if (currentPage < totalPages) {
      currentPage++;
      fetchStudents();
    }
  });
}

// Print All Students (table layout, includes First/Last Name, Class, Dept, Fees owed)

printAllBtn.addEventListener('click', () => {
  if (!ensureLicenseActiveOrWarn()) return;
  const source = filteredStudents.length ? filteredStudents : students;
  if (source.length === 0) {
    showNotification(t('notifNoStudentsToPrint'), 'info');
    return;
  }
  printStudentsTable(source);
});

function printStudentsTable(studentsToPrint) {
  const printWindow = window.open('', '_blank');
  const totalStudents = studentsToPrint.length;
  const rowsHtml = studentsToPrint.map(student => {
      const requiredFees = classFees[student.classLevel] || 0;
      const balance = requiredFees - student.feesPaid;
      const feesOwing = balance > 0 ? formatCurrency(balance) : 'None';
      return `
      <tr>
      <td>${student.matricule || student.id}</td>
      <td>${student.firstName}</td>
      <td>${student.lastName}</td>
      <td>${student.gender}</td>
      <td>${formatDate(student.dob)}</td>
      <td>${getClassDisplayName(student.classLevel)}</td>
      <td>${student.department || ''}</td>
      <td>${student.series || ''}</td>
      <td>${feesOwing}</td>
      </tr>`;
  }).join('');

  const printTime = new Date().toLocaleString();
  const content = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Student List</title>
    <style>
      body { font-family: Arial, sans-serif; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
      .school-info { text-align: center; margin-bottom: 20px; }
      .school-info img { max-width: 100px; max-height: 100px; }
    </style>
  </head>
  <body>
    <div class="school-info">
      <img src="${schoolInfo.logo}" alt="${schoolInfo.name} Logo">
      <h2>${schoolInfo.name}</h2>
      <p>Student List - Printed on: ${printTime}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>Matricule</th>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Gender</th>
          <th>Date of Birth</th>
          <th>Class</th>
          <th>${t('department')}</th>
          <th>${t('series')}</th>
          <th>Fees Owing</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    <p>Total Students: ${totalStudents}</p>
  </body>
  </html>`;
  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.print();
}

// Sorting utility
function sortStudents(list, mode) {
  const arr = [...list];
  switch (mode) {
    case 'nameAsc':
      arr.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
      break;
    case 'nameDesc':
      arr.sort((a, b) => `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`));
      break;
    case 'idAsc':
      arr.sort((a, b) => (a.id || 0) - (b.id || 0));
      break;
    case 'idDesc':
      arr.sort((a, b) => (b.id || 0) - (a.id || 0));
      break;
    default:
      return arr;
  }
  return arr;
}

// Sort button handler
if (sortBtn && sortBySelect) {
  sortBtn.addEventListener('click', () => {
    const mode = sortBySelect.value;
    const source = filteredStudents.length ? filteredStudents : students;
    const sorted = sortStudents(source, mode);
    filteredStudents = sorted; // persist sorted order for printing and further actions
    renderStudents(sorted);
    updateStats(sorted);
  });
}

// School name form handling
const schoolForm = document.querySelector('.school-name form');
const schoolNameInput = document.getElementById('name');
const schoolLogoInput = document.getElementById('logo');
const schoolCodeInput = document.getElementById('school-code');
const academicYearInput = document.getElementById('academic-year');
const regenerateBtn = document.getElementById('regenerate-matricules-btn');

schoolForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('name', schoolNameInput.value);
  if (schoolLogoInput.files[0]) {
    formData.append('logo', schoolLogoInput.files[0]);
  }
  if (schoolCodeInput && schoolCodeInput.value) {
    formData.append('code', schoolCodeInput.value.trim());
  }
  if (academicYearInput && academicYearInput.value) {
    formData.append('academicYear', academicYearInput.value.trim());
  }
  try {
    showLoader(t('loading'));
    const saveBtn = document.getElementById('save-school-btn');
    setButtonLoading(saveBtn, true, t('saveSchoolBtn'));
    const response = await fetch(apiUrl('/api/school'), {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to save school info');
    showNotification(t('notifSchoolInfoSaved'), 'success');
    await fetchSchoolInfo(); // Refresh local cache
  } catch (error) {
    showNotification(tf('errorWithMessage', { message: error.message }), 'error');
  } finally {
    hideLoader();
    const saveBtn = document.getElementById('save-school-btn');
    setButtonLoading(saveBtn, false);
  }
});

// Fetch and cache school info
let schoolInfo = { name: '', logo: '', code: '', academicYear: '' }; // default fallback

async function fetchSchoolInfo() {
  showLoader(t('loading'));
  try {
    const res = await fetch(apiUrl('/api/school'));
    if (res.ok) {
      const data = await res.json();
      if (data && data.name) {
        schoolInfo = data;
        schoolNameInput.value = data.name;
        if (schoolCodeInput) schoolCodeInput.value = data.code || '';
        if (academicYearInput) academicYearInput.value = data.academicYear || '';
        // Update the school name in the header
        const schoolNameDisplay = document.getElementById('school-name-display');
        if (schoolNameDisplay) {
          schoolNameDisplay.textContent = data.name;
        }
        // Update the logo in the header when school info is fetched
        if (data.logo) {
          head.innerHTML = `<img src="${apiUrl(data.logo)}" alt="${data.name} Logo" style="width: 50px; height: 50px;">`;
        }
      }
    }
  } catch {} finally {
    hideLoader();
  }
}

// Fetch class fees from backend
async function fetchClassFees() {
  showLoader(t('loading'));
  try {
    const res = await fetch(apiUrl('/api/class-fees'));
    if (res.ok) {
      const data = await res.json();
      classFees = { ...classFees, ...data };
      // Populate UI fields if present
      for (const key in classFees) {
        const input = document.getElementById('fee-' + key);
        if (input) input.value = classFees[key];
      }
      updateFeesInfoSpans();
    }
  } catch {} finally {
    hideLoader();
  }
}

// Save class fees from UI
const classFeesForm = document.getElementById('class-fees-form');
if (classFeesForm) {
  classFeesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      showLoader(t('loading'));
      const submitBtn = e.submitter || classFeesForm.querySelector('button[type="submit"]');
      setButtonLoading(submitBtn, true, t('btnSaveFees'));

      // Build fees object from inputs with ids like #fee-<classKey>
      const fees = {};
      const keys = Object.keys(classFees);
      keys.forEach((key) => {
        const input = document.getElementById('fee-' + key);
        const val = input ? Number(input.value) : 0;
        if (!Number.isFinite(val) || val < 0) {
          fees[key] = 0;
        } else {
          fees[key] = Math.floor(val); // store as integer
        }
      });

      const response = await fetch(apiUrl('/api/class-fees'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fees),
      });
      if (!response.ok) throw new Error('Failed to save class fees');

      showNotification(t('notifClassFeesUpdated'), 'success');
      await fetchClassFees();
      updateFeesInfoSpans();
    } catch (err) {
      showNotification(t('notifErrorSavingClassFees'), 'error');
    } finally {
      hideLoader();
      const submitBtn = e.submitter || classFeesForm.querySelector('button[type="submit"]');
      setButtonLoading(submitBtn, false);
    }
  });
}

// Regenerate matricules button
if (regenerateBtn) {
  regenerateBtn.addEventListener('click', async () => {
    if (!ensureLicenseActiveOrWarn()) return;
    try {
      showLoader(t('loading'));
      setButtonLoading(regenerateBtn, true, t('regenerateMatriculesBtn'));
      const res = await fetch(apiUrl('/api/regenerate-matricules'), { method: 'POST' });
      if (!res.ok) throw new Error('Failed to regenerate matricules');
      const result = await res.json();
      showNotification(tf('notifMatriculesUpdated', { count: result.updated }), 'success');
      await fetchStudents();
      renderStudents(filteredStudents.length ? filteredStudents : students);
    } catch (err) {
      showNotification(tf('errorWithMessage', { message: err.message }), 'error');
    } finally {
      hideLoader();
      setButtonLoading(regenerateBtn, false);
    }
  });
}

// License UI elements
const licenseStatusText = document.getElementById('license-status-text');
const licenseExpiresText = document.getElementById('license-expires-text');
const licenseKeyInput = document.getElementById('license-key');
const activateLicenseBtn = document.getElementById('activate-license-btn');
const deactivateLicenseBtn = document.getElementById('deactivate-license-btn');
const licenseBanner = document.getElementById('license-banner');
const licenseBannerText = document.getElementById('license-banner-text');
const licenseManageBtn = document.getElementById('license-manage-btn');
let licenseStatusCache = { status: 'unknown' };

function daysLeft(expIso) {
  if (!expIso) return null;
  const end = new Date(expIso).getTime();
  if (!end) return null;
  const ms = end - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function updateLicenseBanner(data) {
  if (!licenseBanner || !licenseBannerText) return;
  const dLeft = daysLeft(data?.expiresAt);
  if (data?.status !== 'active') {
    licenseBanner.classList.remove('hidden');
    licenseBanner.classList.add('banner-error');
    licenseBannerText.innerHTML = tf('bannerMissingExpiredHtml', {
      name: 'Meriki Jubert',
      email: 'merikijubert27@gmail.com',
      phone: '+237675086269'
    });
    return;
  }
  // Active
  if (dLeft != null && dLeft <= 30) {
    licenseBanner.classList.remove('hidden');
    licenseBanner.classList.remove('banner-error');
    licenseBanner.classList.add('banner-warn');
    licenseBannerText.textContent = tf('bannerExpiresSoon', { days: dLeft, date: data.expiresAt });
  } else {
    licenseBanner.classList.add('hidden');
  }
}

async function fetchLicenseStatus() {
  try {
    const res = await fetch(apiUrl('/api/license'));
    if (!res.ok) throw new Error('Failed to load license');
    const data = await res.json();
    licenseStatusCache = data;
    if (licenseStatusText) licenseStatusText.textContent = data.status || 'missing';
    if (licenseExpiresText) licenseExpiresText.textContent = data.expiresAt || '-';
    updateLicenseBanner(data);
  } catch (e) {
    if (licenseStatusText) licenseStatusText.textContent = 'error';
    updateLicenseBanner({ status: 'missing' });
  }
}

if (activateLicenseBtn) {
  activateLicenseBtn.addEventListener('click', async () => {
    try {
      showLoader(t('loading'));
      setButtonLoading(activateLicenseBtn, true, t('activateLicenseBtn'));
      const key = (licenseKeyInput?.value || '').trim();
      if (!key) throw new Error('Please paste a license key');
      const res = await fetch(apiUrl('/api/license'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.reason || data?.error || 'Activation failed');
      showNotification(t('notifLicenseActivated'), 'success');
      await fetchLicenseStatus();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      showNotification(tf('errorWithMessage', { message: err.message }), 'error');
    } finally {
      hideLoader();
      setButtonLoading(activateLicenseBtn, false);
    }
  });
}

if (deactivateLicenseBtn) {
  deactivateLicenseBtn.addEventListener('click', async () => {
    try {
      if (!confirm('Deactivate license? This will lock protected features until you activate again.')) return;
      showLoader(t('loading'));
      setButtonLoading(deactivateLicenseBtn, true, t('deactivateLicenseBtn'));
      const res = await fetch(apiUrl('/api/license'), { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to deactivate');
      showNotification(t('notifLicenseDeactivated'), 'success');
      setTimeout(() => window.location.reload(), 400);
    } catch (e) {
      showNotification(tf('errorWithMessage', { message: e.message }), 'error');
    } finally {
      hideLoader();
      setButtonLoading(deactivateLicenseBtn, false);
    }
  });
}

if (licenseManageBtn) {
  licenseManageBtn.addEventListener('click', () => {
    document.querySelector('.license-panel')?.scrollIntoView({ behavior: 'smooth' });
  });
}

// Helper to guard protected actions
function ensureLicenseActiveOrWarn() {
  if (!licenseStatusCache || licenseStatusCache.status !== 'active') {
    showNotification(t('notifLicenseMissingOrExpired'), 'error');
    return false;
  }
  return true;
}

// Hook into app init
async function initApp() {
  await fetchClassFees();  // First, get class fees from backend
  await fetchLicenseStatus();
  await fetchSchoolInfo();
  await fetchStudents();
  renderStudents(students);
}

initApp();

function updateFeesInfoSpans() {
  document.querySelectorAll('.fees-info').forEach(span => {
    const classKey = span.dataset.class; // e.g. data-class="form1"
    if (classKey && classFees[classKey] !== undefined) {
      span.textContent = formatCurrency(classFees[classKey]);
    }
  });
}

// Scroll to Top Button Functionality
const scrollToTopBtn = document.getElementById('scroll-to-top');
const formSection = document.querySelector('.form-section');

// Show/hide scroll button based on scroll position
window.addEventListener('scroll', () => {
  if (!formSection) return;
  
  // Get the position of the form section
  const formSectionBottom = formSection.offsetTop + formSection.offsetHeight;
  
  // Show button when scrolled beyond the form section
  if (window.scrollY > formSectionBottom) {
    scrollToTopBtn.classList.add('show');
  } else {
    scrollToTopBtn.classList.remove('show');
  }
});

// Scroll to top when button is clicked
scrollToTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

function studentCardActionsHtml(isInactive) {
  if (isInactive) {
    return `
      <button class="btn btn-warning reactivate-btn"><i class="fas fa-undo"></i> ${t('btnReactivate')}</button>
      <button class="btn btn-danger delete-btn"><i class="fas fa-trash"></i> ${t('btnDelete')}</button>
    `;
  }
  return `
    <a href="#student-form" style="text-decoration: none;"><button class="btn btn-secondary edit-btn"><i class="fas fa-edit"></i> ${t('btnEdit')}</button></a>
    <button class="btn btn-outline inactivate-btn"><i class="fas fa-user-slash"></i> ${t('btnMarkInactive')}</button>
    <button class="btn btn-danger delete-btn"><i class="fas fa-trash"></i> ${t('btnDelete')}</button>
    <button class="btn btn-success print-btn"><i class="fas fa-print"></i> ${t('btnPrint')}</button>
  `;
}