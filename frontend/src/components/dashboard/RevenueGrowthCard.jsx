import React, { useMemo } from "react";

const RevenueGrowthCard = ({ title, data, buttonText, onButtonClick }) => {

  const randomColor = () =>
    `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
  const coloredData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        dotColor: randomColor(),
        barColor: randomColor(),
      })),
    [data]
  );
  return (
    <div className="rounded-xl px-4 bg-[#fff] p-6 w-full">
      {/* Title */}
      <h2 className="text-[16px] font-bold text-gray-900 mb-4">
        {title}
      </h2>

      {/* Card */}
      <div className="rounded-lg border border-[#c9c7ff] bg-[#ededf8] p-4">
        {coloredData.map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.dotColor }}
                />
                <span className="text-[12px] text-gray-800 truncate max-w-[120px]">
                  {item.label}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[12px] text-gray-800">
                  {item.value}
                </span>
                <span
                  className="h-2 w-6 rounded"
                  style={{ backgroundColor: item.barColor }}
                />
              </div>
            </div>

            {index !== data.length - 1 && (
              <div className="h-[1px] bg-[#d7d5ff]" />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 flex flex-col">
        <h3 className="text-[14px] font-bold text-gray-900">
          This Year Queries /{" "}
          <span className="text-blue-600">Confirmed</span>
        </h3>

        <button
          onClick={onButtonClick}
          className="mt-2 w-fit px-2 self-center  text-[12px] rounded-md bg-[#2f5f9e] py-2 text-white font-medium hover:bg-[#244c80] transition"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default RevenueGrowthCard;
