import { useState, useCallback, useRef } from 'react';
import { handleFieldChange } from '../utils/validation';

export function useForm(initialValues, onSubmit, validate) {
  const initialValuesRef = useRef(initialValues);
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmitRef  = useRef(onSubmit);  onSubmitRef.current  = onSubmit;
  const formDataRef  = useRef(formData);  formDataRef.current  = formData;
  const validateRef  = useRef(validate);  validateRef.current  = validate;

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const formatted = handleFieldChange(name, value);
    setFormData(prev => ({ ...prev, [name]: formatted }));
  }, []);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    if (validateRef.current) {
      setErrors(prev => {
        const all = validateRef.current({ ...formDataRef.current });
        return { ...prev, [name]: all[name] };
      });
    }
  }, []);

  const validateOnly = useCallback(() => {
    const data = formDataRef.current;
    const newErrors = validateRef.current ? validateRef.current(data) : {};
    setErrors(newErrors);
    const allTouched = Object.keys(data).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);
    return Object.keys(newErrors).length === 0;
  }, []);

  const submitNow = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onSubmitRef.current(formDataRef.current);
    } catch (err) {
      console.error('Form submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const data = formDataRef.current;
    const newErrors = validateRef.current ? validateRef.current(data) : {};
    setErrors(newErrors);
    const allTouched = Object.keys(data).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);
    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      try {
        await onSubmitRef.current(data);
      } catch (err) {
        console.error('Form submission error:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    setFormData(initialValuesRef.current);
    setErrors({});
    setTouched({});
  }, []);

  return { formData, setFormData, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit, validateOnly, submitNow, reset };
}
