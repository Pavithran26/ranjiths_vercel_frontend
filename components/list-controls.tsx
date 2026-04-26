import type { ChangeEvent } from "react";

interface ListControlsProps {
  pageSize: string;
  startDate: string;
  endDate: string;
  onPageSizeChange: (size: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onFilterApply: () => void;
  onFilterClear: () => void;
}

export function ListControls({
  pageSize,
  startDate,
  endDate,
  onPageSizeChange,
  onStartDateChange,
  onEndDateChange,
  onFilterApply,
  onFilterClear,
}: ListControlsProps) {
  return (
    <div className="list-controls" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem", alignItems: "flex-end" }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Show entries</label>
        <select
          className="form-input"
          value={pageSize}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onPageSizeChange(e.target.value)}
          style={{ width: "120px" }}
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Start Date</label>
        <input
          type="date"
          className="form-input"
          value={startDate}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onStartDateChange(e.target.value)}
        />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">End Date</label>
        <input
          type="date"
          className="form-input"
          value={endDate}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onEndDateChange(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="button" className="primary-button" onClick={onFilterApply}>
          Apply
        </button>
        {(startDate || endDate) && (
          <button type="button" className="secondary-button" onClick={onFilterClear}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
