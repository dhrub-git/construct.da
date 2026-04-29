export const authClerkAppearance = {
  variables: {
    borderRadius: "0.875rem",
    colorBackground: "var(--card)",
    colorDanger: "var(--destructive)",
    colorInputBackground: "var(--background)",
    colorInputText: "var(--foreground)",
    colorPrimary: "var(--primary)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full !shadow-none",
    card: "!w-full !rounded-[1.25rem] !border-0 !bg-card !shadow-none",
    header: "!hidden",
    headerTitle: "!hidden",
    headerSubtitle: "!hidden",
    main: "!gap-5",
    socialButtonsBlockButton:
      "!min-h-11 !cursor-pointer !rounded-lg !border !border-input !bg-background !text-foreground !shadow-none transition-colors duration-200 hover:!bg-secondary focus-visible:!ring-2 focus-visible:!ring-ring focus-visible:!ring-offset-2",
    socialButtonsBlockButtonText: "!font-medium !text-foreground",
    dividerLine: "!bg-border",
    dividerText: "!text-muted-foreground",
    formFieldLabel: "!text-sm !font-medium !text-foreground",
    formFieldInput:
      "!min-h-11 !rounded-lg !border-input !bg-background !px-4 !text-base !text-foreground focus:!border-ring focus:!ring-2 focus:!ring-ring/30",
    formFieldInputShowPasswordButton:
      "!min-h-11 !cursor-pointer !text-muted-foreground hover:!text-foreground focus-visible:!ring-2 focus-visible:!ring-ring",
    formButtonPrimary:
      "!min-h-11 !cursor-pointer !rounded-lg !bg-primary !text-base !font-medium !text-primary-foreground !shadow-none transition-colors duration-200 hover:!bg-primary/90 focus-visible:!ring-2 focus-visible:!ring-ring focus-visible:!ring-offset-2",
    footer: "!bg-card",
    footerActionText: "!text-muted-foreground",
    footerActionLink:
      "!font-medium !text-primary transition-colors duration-200 hover:!text-primary/80 focus-visible:!ring-2 focus-visible:!ring-ring",
    formFieldErrorText: "!text-destructive",
  },
} as const;
