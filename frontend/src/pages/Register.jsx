import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/layout/AuthShell";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

const LOCATIONS = [
  "Kondapur", "Gachibowli", "Madhapur", "Kukatpally",
  "Banjara Hills", "Anantapur", "Karimnagar", "Nalgonda", "Other",
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("CONSUMER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Name is required."); return; }
    if (!email)       { setError("Email is required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (!location)    { setError("Please choose your location."); return; }

    try {
      setSubmitting(true);
      const user = await register(name.trim(), email, password, role, location);
      navigate(user.role === "FARMER" ? "/farmer" : "/consumer", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const INPUT_CLS =
    "mt-1.5 w-full rounded-xl border border-forest-800/12 bg-canvas px-4 py-2.5 text-sm placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-forest-600";

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join FarmDirect as a consumer or a farmer"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-forest-800 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {error && (
          <p role="alert" className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800">
            {error}
          </p>
        )}

        {/* Role selector */}
        <fieldset>
          <legend className="text-sm font-medium text-ink-soft mb-1.5">I am a</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "CONSUMER", label: "Consumer" },
              { value: "FARMER",   label: "Farmer" },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                aria-pressed={role === value}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  role === value
                    ? "border-forest-800 bg-forest-800 text-canvas"
                    : "border-forest-800/15 text-ink-soft hover:bg-forest-800/[0.06]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="name" className="text-sm font-medium text-ink-soft">Full name</label>
          <input
            id="name" type="text" autoComplete="name" placeholder="Your name"
            value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLS}
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="text-sm font-medium text-ink-soft">Email</label>
          <input
            id="reg-email" type="email" autoComplete="email" placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_CLS}
          />
        </div>

        <div>
          <label htmlFor="reg-password" className="text-sm font-medium text-ink-soft">Password</label>
          <input
            id="reg-password" type="password" autoComplete="new-password" placeholder="At least 6 characters"
            value={password} onChange={(e) => setPassword(e.target.value)} className={INPUT_CLS}
          />
        </div>

        <div>
          <label htmlFor="reg-location" className="text-sm font-medium text-ink-soft">Location</label>
          <select
            id="reg-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={INPUT_CLS + " cursor-pointer"}
          >
            <option value="">Select your area</option>
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="mt-2 w-full"
          disabled={submitting}
        >
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
