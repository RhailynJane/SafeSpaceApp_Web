const Field = ({ label, id, value, onChange, placeholder, type = 'text' }) => (
    <div>
      <label className="font-semibold text-gray-700">{label}</label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full mt-1 p-3 border border-gray-300 rounded-lg"
      />
    </div>
  );
  
  const TextArea = ({ label, id, value, onChange, placeholder }) => (
    <div>
      <label className="font-semibold text-gray-700">{label}</label>
      <textarea
        id={id}
        rows="4"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full mt-1 p-3 border border-gray-300 rounded-lg"
      ></textarea>
    </div>
  );

  export { Field, TextArea };