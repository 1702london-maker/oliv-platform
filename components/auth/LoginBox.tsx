type LoginBoxProps = {
  next: string;
  error?: string;
  detail?: string;
};

export function LoginBox({ next, error, detail }: LoginBoxProps) {
  const message =
    error === "missing"
      ? "Bitte gib deine E-Mail-Adresse und dein Passwort ein."
      : error === "invalid"
        ? `Falsche E-Mail-Adresse oder falsches Passwort.${detail ? ` (${detail})` : ""}`
        : error === "profile"
          ? "Anmeldung erfolgreich, aber das Kontoprofil konnte nicht geladen werden. Supabase Service Role Key in Vercel prüfen."
          : "";

  return (
    <form action="/api/auth/login-form" method="post">
      <input name="next" type="hidden" value={next} />
      {message ? <div className="ohs-auth-alert-error">{message}</div> : null}
      <div className="ohs-auth-field">
        <label className="ohs-auth-label" htmlFor="ohs-login-email">E-Mail-Adresse</label>
        <input className="ohs-auth-input" id="ohs-login-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="ohs-auth-field">
        <label className="ohs-auth-label" htmlFor="ohs-login-password">Passwort</label>
        <input className="ohs-auth-input" id="ohs-login-password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button className="ohs-auth-btn" type="submit">Anmelden</button>
    </form>
  );
}
