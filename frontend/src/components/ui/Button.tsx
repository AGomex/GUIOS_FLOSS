import type { ReactNode } from "react"

type ButtonVariant = "primary" | "secondary" | "text"

type ButtonProps = {
  children: ReactNode
  variant?: ButtonVariant
  disabled?: boolean
  onClick?: () => void
  type?: "button" | "submit"
}

export function Button({
  children,
  variant = "primary",
  disabled = false,
  onClick,
  type = "button",
}: ButtonProps) {
  return (
    <button
      className={`button button--${variant}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  )
}
