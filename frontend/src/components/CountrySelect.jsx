import { COUNTRIES, flagEmoji } from "../utils/countries.js";

/**
 * A <select> of countries. Calling code changes the dial code automatically
 * via onChange(countryName, dialCode) — the caller doesn't need to look it
 * up separately.
 */
export default function CountrySelect({ value, onChange, disabled, placeholder = "Select your country" }) {
  return (
    <select
      className="plain-input"
      value={value || ""}
      disabled={disabled}
      onChange={(e) => {
        const name = e.target.value;
        const match = COUNTRIES.find((c) => c.name === name);
        onChange(name, match ? match.dial : "");
      }}
      dir="ltr"
    >
      <option value="" disabled>{placeholder}</option>
      {COUNTRIES.map((c) => (
        <option key={c.iso2} value={c.name}>
          {flagEmoji(c.iso2)} {c.name} ({c.dial})
        </option>
      ))}
    </select>
  );
}
