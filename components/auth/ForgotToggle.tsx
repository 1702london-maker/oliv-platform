"use client";
import { useEffect } from "react";

export function ForgotToggle() {
  useEffect(() => {
    const toForgot = document.getElementById("ohs-to-forgot");
    const toSignin = document.getElementById("ohs-to-signin");
    const signinPanel = document.getElementById("ohs-signin-panel");
    const forgotPanel = document.getElementById("ohs-forgot-panel");

    const showForgot = () => {
      signinPanel?.classList.add("ohs-hidden");
      forgotPanel?.classList.remove("ohs-hidden");
    };
    const showSignin = () => {
      forgotPanel?.classList.add("ohs-hidden");
      signinPanel?.classList.remove("ohs-hidden");
    };

    toForgot?.addEventListener("click", showForgot);
    toSignin?.addEventListener("click", showSignin);

    return () => {
      toForgot?.removeEventListener("click", showForgot);
      toSignin?.removeEventListener("click", showSignin);
    };
  }, []);

  return null;
}
