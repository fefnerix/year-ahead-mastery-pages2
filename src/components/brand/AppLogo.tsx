import logo365 from "@/assets/logo-365.png";

type LogoVariant = "login" | "header" | "section" | "admin";

interface AppLogoProps {
  variant?: LogoVariant;
  className?: string;
  showText?: boolean;
}

const heightMap: Record<LogoVariant, number> = {
  login: 160,
  header: 40,
  section: 168,
  admin: 40,
};

const AppLogo = ({ variant = "header", className = "", showText = false }: AppLogoProps) => {
  const h = heightMap[variant];

  if (showText || variant === "login") {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <img
          src={logo365}
          alt="PROGRESS 365"
          width={h}
          height={h}
          fetchPriority="high"
          decoding="async"
          className="block shrink-0 object-contain"
          style={{ height: h, width: "auto" }}
        />
        {variant === "login" && (
          <div className="text-center">
            <h1 className="text-3xl font-display font-bold gold-text">PROGRESS</h1>
            <p className="text-xs text-muted-foreground mt-1 tracking-widest uppercase">
              Tu transformación diaria
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logo365}
        alt="PROGRESS 365"
        width={h}
        height={h}
        fetchPriority="high"
        decoding="async"
        className="block shrink-0 object-contain"
        style={{ height: h, width: "auto" }}
      />
      {variant === "header" && (
        <span className="text-sm font-bold text-foreground tracking-wider">PROGRESS</span>
      )}
    </div>
  );
};

export default AppLogo;
