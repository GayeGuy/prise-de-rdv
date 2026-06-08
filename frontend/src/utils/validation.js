/**
 * Validation et Formatting pour les champs de réservation
 * Formatage instantané : les caractères interdits sont bloqués à la saisie,
 * les transformations (majuscules, etc.) s'appliquent caractère par caractère.
 */

// ─────────────────────────────────────────────
// Formateurs (transforment la valeur complète)
// ─────────────────────────────────────────────

export const formatters = {
  nom:            (v) => v.toUpperCase().replace(/[^A-ZÀ-ÖØ-Ýa-zà-öø-ý\s\-']/gi, '').toUpperCase(),
  prenom:         (v) => v.toUpperCase().replace(/[^A-ZÀ-ÖØ-Ýa-zà-öø-ý\s\-']/gi, '').toUpperCase(),
  phone:          (v) => v.replace(/\D/g, '').slice(0, 10),
  email:          (v) => v.toLowerCase().replace(/\s/g, ''),
  chrono:         (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, ''),
  vin:            (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17),
  immatriculation:(v) => {
    // Extraire uniquement lettres et chiffres en majuscules
    const clean = v.toUpperCase().replace(/[^A-Z0-9]/g, '');
    // Segmenter : 2 lettres | 3 chiffres | 2 lettres
    let part1 = '', part2 = '', part3 = '';
    let letters1 = 0, digits = 0, letters2 = 0;
    for (const c of clean) {
      const isLetter = /[A-Z]/.test(c);
      const isDigit = /[0-9]/.test(c);
      if (letters1 < 2 && isLetter) { part1 += c; letters1++; }
      else if (letters1 === 2 && digits < 3 && isDigit) { part2 += c; digits++; }
      else if (digits === 3 && letters2 < 2 && isLetter) { part3 += c; letters2++; }
    }
    // Assembler avec tirets uniquement si la partie précédente est complète
    let result = part1;
    if (part1.length === 2 && part2.length > 0) result += '-' + part2;
    else if (part1.length === 2) result += (part2 ? '-' + part2 : '');
    if (part2.length === 3 && part3.length > 0) result += '-' + part3;
    return result;
  },
  code:           (v) => v.toUpperCase().replace(/[^A-Z0-9\-_]/g, ''),
  username:       (v) => v.toLowerCase().replace(/[^a-z0-9.\-_]/g, ''),
  name:           (v) => v.replace(/[^A-ZÀ-ÖØ-Ýa-zà-öø-ý0-9\s\-'.,()]/gi, ''),
  region:         (v) => v.replace(/[^A-ZÀ-ÖØ-Ýa-zà-öø-ý0-9\s\-']/gi, ''),
  commune:        (v) => v.replace(/[^A-ZÀ-ÖØ-Ýa-zà-öø-ý0-9\s\-']/gi, ''),
};

// ─────────────────────────────────────────────
// Validateurs (retournent un message d'erreur ou null)
// ─────────────────────────────────────────────

export const validators = {
  phone: (v) => {
    const c = v.replace(/\D/g, '');
    if (c.length !== 10) return 'Le téléphone doit contenir 10 chiffres';
    return null;
  },
  chrono: (v) => {
    if (!v) return null;
    if (!/^[A-Z0-9]+$/.test(v.toUpperCase())) return 'Le Chrono doit contenir uniquement des chiffres et des lettres';
    return null;
  },
  vin: (v) => {
    if (!v) return null;
    if (!/^[A-Z0-9]+$/.test(v.toUpperCase())) return 'Le VIN doit contenir uniquement des chiffres et des lettres';
    if (v.length > 17) return 'Le VIN doit contenir maximum 17 caractères';
    return null;
  },
  immatriculation: (v) => {
    if (!v) return null;
    if (!/^[A-Z0-9\-]+$/.test(v.toUpperCase())) return "L'immatriculation doit contenir uniquement des chiffres, des lettres et des tirets";
    return null;
  },
  nom: (v) => {
    if (!v) return null;
    if (!/^[A-ZÀ-ÖØ-Ýa-zà-öø-ý\s\-']+$/i.test(v)) return 'Ce champ ne doit contenir que des lettres, espaces et tirets';
    return null;
  },
  prenom: (v) => {
    if (!v) return null;
    if (!/^[A-ZÀ-ÖØ-Ýa-zà-öø-ý\s\-']+$/i.test(v)) return 'Ce champ ne doit contenir que des lettres, espaces et tirets';
    return null;
  },
  email: (v) => {
    if (!v) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Veuillez entrer une adresse email valide';
    return null;
  },
};

// ─────────────────────────────────────────────
// API publique
// ─────────────────────────────────────────────

/**
 * Applique le formateur du champ et retourne la valeur transformée.
 */
export function handleFieldChange(name, value) {
  const fmt = formatters[name];
  return fmt ? fmt(value) : value;
}

/**
 * Valide un champ et retourne le message d'erreur ou null.
 */
export function validateField(name, value) {
  const v = validators[name];
  return v ? v(value) : null;
}

/**
 * Validation complète du formulaire de réservation.
 */
export function validateForm(formData) {
  const errors = {};

  if (!formData.nom?.trim()) errors.nom = 'Le nom est requis';
  else { const e = validateField('nom', formData.nom); if (e) errors.nom = e; }

  if (!formData.prenom?.trim()) errors.prenom = 'Le prénom est requis';
  else { const e = validateField('prenom', formData.prenom); if (e) errors.prenom = e; }

  if (!formData.phone?.trim()) errors.phone = 'Le téléphone est requis';
  else { const e = validateField('phone', formData.phone); if (e) errors.phone = e; }

  if (formData.email) {
    const e = validateField('email', formData.email);
    if (e) errors.email = e;
  }

  const isPIMO   = formData.centreType === 'PIMO';
  const isReimat = formData.centreType === 'POST_REIMMAT';

  if (isPIMO) {
    if (!formData.chrono?.trim()) errors.chrono = 'Le Chrono est requis';
    else { const e = validateField('chrono', formData.chrono); if (e) errors.chrono = e; }
    if (!formData.immatriculation?.trim()) errors.immatriculation = "L'immatriculation est requise";
    else { const e = validateField('immatriculation', formData.immatriculation); if (e) errors.immatriculation = e; }
    if (!formData.vin?.trim()) errors.vin = 'Le châssis est requis';
    else { const e = validateField('vin', formData.vin); if (e) errors.vin = e; }
  } else if (isReimat) {
    if (!formData.immatriculation?.trim()) errors.immatriculation = "L'immatriculation est requise";
    else { const e = validateField('immatriculation', formData.immatriculation); if (e) errors.immatriculation = e; }
    if (!formData.vin?.trim()) errors.vin = 'Le châssis est requis';
    else { const e = validateField('vin', formData.vin); if (e) errors.vin = e; }
  } else if (formData.immatriculation) {
    const e = validateField('immatriculation', formData.immatriculation);
    if (e) errors.immatriculation = e;
  }

  return errors;
}

/**
 * Crée un handler onChange qui applique le formateur du champ
 * et préserve la position du curseur.
 *
 * Usage :
 *   const handleChange = makeFieldHandler('nom', (val) => setForm(f => ({ ...f, nom: val })));
 *   <input name="nom" onChange={makeFieldHandler('nom', setter)} />
 */
export function makeFieldHandler(name, setter) {
  return (e) => {
    const input = e.target;
    const rawValue = input.value;
    const formatted = handleFieldChange(name, rawValue);

    // Décalage de curseur si des caractères ont été supprimés
    const removed = rawValue.length - formatted.length;
    const selStart = Math.max(0, (input.selectionStart ?? rawValue.length) - removed);
    const selEnd   = Math.max(0, (input.selectionEnd   ?? rawValue.length) - removed);

    setter(formatted);

    requestAnimationFrame(() => {
      if (input.setSelectionRange && document.activeElement === input) {
        try { input.setSelectionRange(selStart, selEnd); } catch (_) {}
      }
    });
  };
}

/**
 * Retourne un handler onChange unique pour un formulaire-objet.
 * Lit e.target.name pour savoir quel champ formater.
 *
 * Usage :
 *   const handleChange = makeObjectFieldHandler(setForm);
 *   <input name="nom" onChange={handleChange} />
 */
export function makeObjectFieldHandler(setFormFn) {
  return (e) => {
    const input = e.target;
    const { name, value: rawValue } = input;
    const formatted = handleFieldChange(name, rawValue);

    const removed = rawValue.length - formatted.length;
    const selStart = Math.max(0, (input.selectionStart ?? rawValue.length) - removed);
    const selEnd   = Math.max(0, (input.selectionEnd   ?? rawValue.length) - removed);

    setFormFn(prev => ({ ...prev, [name]: formatted }));

    requestAnimationFrame(() => {
      if (input.setSelectionRange && document.activeElement === input) {
        try { input.setSelectionRange(selStart, selEnd); } catch (_) {}
      }
    });
  };
}
