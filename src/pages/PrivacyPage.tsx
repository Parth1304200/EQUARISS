import React from "react";
import { ArrowLeft } from "lucide-react";
import { useApp } from "../context/AppContext";
import { EquarisLogo } from "../components/EquarisLogo";

const renderText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

export const PrivacyPage: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="min-h-screen bg-background text-foreground relative font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
          <button
            onClick={() => { navigate("/"); window.scrollTo(0, 0); }}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-8"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          
          <div className="flex items-center gap-2 text-primary ml-auto">
            <EquarisLogo className="h-6 w-auto" />
            <span className="font-heading text-lg font-bold">EQUARIS</span>
          </div>
        </div>
      </header>

      {/* CONTENT HERO */}
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <div className="flex flex-col gap-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            How we protect your data.
          </p>
        </div>

        {/* CONTENT BODY */}
        <div className="flex flex-col gap-4 text-muted-foreground leading-relaxed text-lg">
          {`At Equaris, your privacy is our priority. We collect only the data necessary to provide you with seamless expense tracking.\n\n- **Data Storage:** Your group data, expenses, and profiles are securely stored in our cloud infrastructure.\n- **Data Sharing:** We do not sell your personal data to third parties.\n- **Security:** We use industry-standard encryption for all data in transit.`.split('\\n').map((line, i) => (
            <p key={i}>{renderText(line)}</p>
          ))}
        </div>
      </div>
    </div>
  );
};
