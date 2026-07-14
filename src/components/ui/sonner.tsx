import * as React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// This app owns theming via a `.dark` class on <html> (see AppContext), so the
// Toaster observes that class directly instead of depending on next-themes.
const useDocumentTheme = (): ToasterProps["theme"] => {
  const [theme, setTheme] = React.useState<ToasterProps["theme"]>(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"
  )
  React.useEffect(() => {
    const el = document.documentElement
    const sync = () => setTheme(el.classList.contains("dark") ? "dark" : "light")
    const observer = new MutationObserver(sync)
    observer.observe(el, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])
  return theme
}

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useDocumentTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
