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

export const TermsPage: React.FC = () => {
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
            Terms of Service
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            The rules of the road.
          </p>
        </div>

        {/* CONTENT BODY */}
        <div className="flex flex-col gap-4 text-muted-foreground leading-relaxed text-lg">
          {`By using Equaris, you agree to our Terms of Service.\n\n- You must provide accurate information when creating an account.\n- Equaris is a ledger tool; we do not process actual monetary transactions or hold funds.\n- You are responsible for ensuring real-world settlements match the app's records.`.split('\\n').map((line, i) => (
            <p key={i}>{renderText(line)}</p>
          ))}
        </div>
      </div>
    </div>
  );
};
