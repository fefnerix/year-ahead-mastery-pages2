import logo365 from "@/assets/logo-365.png";

interface BrandLogoProps {
  variant?: "header" | "login" | "card" | "full";
  className?: string;
}

const sizeMap = {
  header: 22,
  card: 18,
  login: 48,
  full: 48,
} as const;

const BrandLogo = ({ variant = "header", className = "" }: BrandLogoProps) => {
  const size = sizeMap[variant];

  if (variant === "full") {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <img
          src={logo365}
          alt="PROGRESS 365"
          width={size}
          height={size}
          className="block shrink-0 object-contain"
          style={{ width: size, height: size }}
        />
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold gold-text">PROGRESS</h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-widest uppercase">
            Tu transformación diaria
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logo365}
        alt="PROGRESS 365"
        width={size}
        height={size}
        className="block shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
      {variant === "header" && (
        <span className="text-sm font-bold text-foreground tracking-wider">PROGRESS</span>
      )}
    </div>
  );
};

export default BrandLogo;
