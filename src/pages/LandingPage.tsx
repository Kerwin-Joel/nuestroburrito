// src/pages/LandingPage.tsx
import "../landing/styles/landing.css";   // ← solo aplica cuando esta página está montada
import BurritoLanding from "../components/landing/BurritoLanding";

export default function LandingPage() {
    return (
        <main>
            <BurritoLanding />
        </main>
    );
}