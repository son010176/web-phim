// src/hooks/useCouplesFilter.js

import { useState, useMemo, useCallback } from 'react';

export function useCouplesFilter(allCouples) {
  const [sortOrder, setSortOrder] = useState('default');

  const handleSortChange = useCallback((order) => {
    setSortOrder(order);
  }, []);

  const sortedCouples = useMemo(() => {
    const couplesToSort = [...allCouples];
    if (sortOrder === 'az') {
      return couplesToSort.sort((a, b) => a.tenCouple.localeCompare(b.tenCouple, 'vi'));
    }
    if (sortOrder === 'za') {
      return couplesToSort.sort((a, b) => b.tenCouple.localeCompare(a.tenCouple, 'vi'));
    }
    return allCouples;
  }, [sortOrder, allCouples]);

  return {
    displayCouples: sortedCouples,
    sortOrder,
    handleSortChange
  };
}