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

export const FeaturesPage: React.FC = () => {
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
            Features
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Everything you need to split effortlessly.
          </p>
        </div>

        {/* CONTENT BODY */}
        <div className="flex flex-col gap-4 text-muted-foreground leading-relaxed text-lg">
          {`- **Split Equally:** Instant, straightforward division among all members.\n- **Weighted Splits:** Granular control over exactly who pays what portion.\n- **Category Analytics:** Visualize where your group's money is going with our intuitive charts.\n- **Instant Settlements:** Generate zero-friction settlement plans ensuring minimum transactions.`.split('\\n').map((line, i) => (
            <p key={i}>{renderText(line)}</p>
          ))}
        </div>
      </div>
    </div>
  );
};
