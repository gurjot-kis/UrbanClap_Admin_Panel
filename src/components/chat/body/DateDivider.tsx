import React from "react";

interface DateDividerProps {
  date: string;
}

const DateDivider: React.FC<DateDividerProps> = ({ date }) => {
  return (
    <div
      className="d-flex justify-content-center my-3 date-divider-element w-100"
      data-date={date}
    >
      <span
        className="px-3 py-1 text-secondary rounded-pill"
        style={{ 
          backgroundColor: "rgba(0,0,0,0.05)", 
          fontSize: "0.75rem", 
          fontWeight: 600,
          letterSpacing: "0.3px"
        }}
      >
        {date}
      </span>
    </div>
  );
};

export default DateDivider;