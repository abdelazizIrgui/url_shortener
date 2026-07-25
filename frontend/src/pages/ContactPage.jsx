import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import InfoPageShell from "../components/InfoPageShell.jsx";
import { useDocumentMeta } from "../utils/useDocumentMeta.js";
import { BRAND_NAME } from "../i18n.js";

export default function ContactPage() {
  useDocumentMeta({
    title: `Contact Us — ${BRAND_NAME}`,
    description: `Need help or have a question? Contact the ${BRAND_NAME} team.`,
    path: "/contact",
  });

  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // TODO: Connect this to your backend API — this form currently doesn't
    // send anywhere, it just simulates success.

    alert("Your message has been sent!");

    setForm({
      name: "",
      email: "",
      message: "",
    });
  };

  return (
    <InfoPageShell>
      <h1>Contact Us</h1>

      <p className="info-page-updated">
        Have a question, suggestion, or need support? Fill out the form below.
      </p>

      <form onSubmit={handleSubmit} className="contact-form">

        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Your Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <textarea
          name="message"
          rows="6"
          placeholder="How can we help you?"
          value={form.message}
          onChange={handleChange}
          required
        />

        <button type="submit">
          Send Message
        </button>

      </form>
    </InfoPageShell>
  );
}