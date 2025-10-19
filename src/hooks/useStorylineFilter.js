// src/hooks/useStorylineFilter.js

import { useState, useMemo, useCallback } from 'react';

export function useStorylineFilter(allStorylines) {
  const [sortOrder, setSortOrder] = useState('default');

  const handleSortChange = useCallback((order) => {
    setSortOrder(order);
  }, []);

  const sortedStorylines = useMemo(() => {
    const storylinesToSort = [...allStorylines];
    if (sortOrder === 'az') {
      return storylinesToSort.sort((a, b) => a.tenCouple.localeCompare(b.tenCouple, 'vi'));
    }
    if (sortOrder === 'za') {
      return storylinesToSort.sort((a, b) => b.tenCouple.localeCompare(a.tenCouple, 'vi'));
    }
    return allStorylines;
  }, [sortOrder, allStorylines]);

  return {
    displayStorylines: sortedStorylines,
    sortOrder,
    handleSortChange
  };
}