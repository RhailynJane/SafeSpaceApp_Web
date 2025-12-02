const Field = ({ label, id, value, onChange, placeholder, type = 'text', required = false }) => (
    <div>
      <label className="font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full mt-1 p-3 border border-gray-300 rounded-lg"
        required={required}
      />
    </div>
  );
  
  const TextArea = ({ label, id, value, onChange, placeholder, required = false }) => (
    <div>
      <label className="font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <textarea
        id={id}
        rows="4"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full mt-1 p-3 border border-gray-300 rounded-lg"
        required={required}
      ></textarea>
    </div>
  );

  export { Field, TextArea };