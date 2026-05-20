"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "rgba(34, 34, 34, 0.94)",
          "--normal-text": "rgba(255, 255, 255, 0.92)",
          "--normal-border": "rgba(255, 255, 255, 0.12)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
