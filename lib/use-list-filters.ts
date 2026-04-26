import { useState, useCallback } from "react";

export interface ListFilterParams {
  pageSize: string;
  startDate: string;
  endDate: string;
}

export function useListFilters() {
  const [pageSize, setPageSize] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // We use this state to trigger refetches only when 'Apply' is clicked (for dates).
  // For page size, we might want to apply immediately or wait for apply. 
  // Let's have a single appliedParams state that triggers the fetch.
  const [appliedParams, setAppliedParams] = useState<ListFilterParams>({
    pageSize: "all",
    startDate: "",
    endDate: "",
  });

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(newSize);
    // Auto-apply page size changes immediately
    setAppliedParams((prev) => ({ ...prev, pageSize: newSize }));
  };

  const handleApply = useCallback(() => {
    setAppliedParams({
      pageSize,
      startDate,
      endDate,
    });
  }, [pageSize, startDate, endDate]);

  const handleClear = useCallback(() => {
    setStartDate("");
    setEndDate("");
    setAppliedParams({
      pageSize,
      startDate: "",
      endDate: "",
    });
  }, [pageSize]);

  return {
    pageSize,
    startDate,
    endDate,
    setPageSize: handlePageSizeChange,
    setStartDate,
    setEndDate,
    appliedParams,
    handleApply,
    handleClear,
  };
}
