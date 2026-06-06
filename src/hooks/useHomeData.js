import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

export function useBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.getBanners();
        if (mounted) setBanners(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setBanners([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { banners, loading };
}

export function useIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await api.getDeviceIssues();
      if (mounted) {
        setIssues(data);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { issues, loading };
}

export function useBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await api.getDeviceBrands();
      if (mounted) {
        setBrands(data);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { brands, loading };
}

export function useChipsets() {
  const [chipsets, setChipsets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await api.getDeviceChipsets();
      if (mounted) {
        setChipsets(data);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { chipsets, loading };
}

export function useLocalStorage(key, initial) {
  const read = useCallback(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      return JSON.parse(raw);
    } catch {
      return initial;
    }
  }, [key, initial]);

  const [value, setValue] = useState(read);

  const set = useCallback((next) => {
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch { /* quota or private mode */ }
  }, [key]);

  return [value, set];
}
