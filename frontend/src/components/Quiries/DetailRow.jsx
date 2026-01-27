function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-[2px]">{icon}</div>

      <div className="flex gap-2">
        <span className="text-blue-600 font-medium whitespace-nowrap">
          {label}
        </span>
        <span className="text-blue-600 font-medium">:</span>
        <span className="text-gray-900 font-medium">
          {value}
        </span>
      </div>
    </div>
  );
}

export default DetailRow;