// ToggleSwitch.js
import React from 'react';

const ToggleSwitch = ({ checked, onChange, label, color }) => {
    const isDeniedSwitch = label === 'Denied Access';
    const checkedColor = isDeniedSwitch ? 'bg-red-600' : 'bg-green-600';
    const togglePosition = checked ? 'translate-x-full' : 'translate-x-0';

    return (
        <label className="flex items-center cursor-pointer space-x-3">
            <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${checked ? checkedColor : 'bg-gray-300'}`}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="sr-only"
                />
                <span
                    className={`absolute left-0 top-0 w-6 h-6 bg-white rounded-full transition-transform duration-300 transform ${togglePosition} shadow-md`}
                ></span>
            </div>
            <span className="text-sm font-medium text-gray-700 select-none">{label}</span>
        </label>
    );
};

export default ToggleSwitch;