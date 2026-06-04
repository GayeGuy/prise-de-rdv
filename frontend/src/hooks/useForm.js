import { useState, useCallback } from 'react';
import { handleFieldChange } from '../utils/validation';

export function useForm(initialValues, onSubmit, validate) {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handler générique : formate la valeur en temps réel via handleFieldChange,
   * puis met à jour formData. Compatible avec FormField (event synthétique).
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const formatted = handleFieldChange(name, value);
    setFormData(prev => ({ ...prev, [name]: formatted }));
  }, []);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    // Déclencher la validation live au blur
    if (validate) {
      setErrors(prev => {
        const all = validate({ ...formData });
        return { ...prev, [name]: all[name] };
      });
    }
  }, [formData, validate]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newErrors = validate ? validate(formData) : {};
    setErrors(newErrors);
    // Marquer tous les champs comme touchés lors de la soumission
    const allTouched = Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    if (Object.keys(newErrors).length === 0) {
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }

    setIsSubmitting(false);
  }, [formData, validate, onSubmit]);

  const reset = useCallback(() => {
    setFormData(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    formData,
    setFormData,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset
  };
}
