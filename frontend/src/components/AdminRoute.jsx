import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLang } from "../context/LangContext.jsx";

export default function AdminRoute({ children }) {
  const { isAuthed, user, loading } = useAuth();
  const { t } = useLang();

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    return (
      <div className="page" style={{ alignItems: "center", justifyContent: "center", display: "flex" }}>
        <div className="error-box" style={{ maxWidth: 420 }}>{t.adminAccessDenied}</div>
      </div>
    );
  }

  return children;
}
