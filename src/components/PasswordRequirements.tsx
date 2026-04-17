import { Check, X } from "lucide-react";

export const PASSWORD_RULES = [
  { key: "length", label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
  { key: "uppercase", label: "Letra maiúscula (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { key: "lowercase", label: "Letra minúscula (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { key: "number", label: "Número (0-9)", test: (p: string) => /[0-9]/.test(p) },
  { key: "special", label: "Caractere especial (!@#$%...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export const isPasswordValid = (password: string) =>
  PASSWORD_RULES.every((r) => r.test(password));

interface Props {
  password: string;
  variant?: "light" | "dark";
}

const PasswordRequirements = ({ password, variant = "dark" }: Props) => {
  if (!password) return null;

  const textMuted = variant === "light" ? "text-muted-foreground" : "text-white/60";
  const helperText = variant === "light" ? "text-muted-foreground" : "text-white/70";

  return (
    <div className="space-y-1 mt-2 px-1">
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <div key={rule.key} className="flex items-center gap-2 text-xs">
            {passed ? (
              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-red-400 shrink-0" />
            )}
            <span className={passed ? "text-green-500" : textMuted}>{rule.label}</span>
          </div>
        );
      })}
      <p className={`pt-1 text-[11px] leading-relaxed ${helperText}`}>
        Além desses critérios, senhas comuns, expostas em vazamentos ou fáceis de adivinhar podem ser recusadas automaticamente.
      </p>
    </div>
  );
};

export default PasswordRequirements;
