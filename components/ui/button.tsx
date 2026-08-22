import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[--radius-md] text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]',
        outline:
          'border border-input bg-background text-foreground hover:bg-gray-100 hover:text-foreground active:scale-[0.98]',
        outlineLight:
          'border border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white active:scale-[0.98]',
        ghost: 'hover:bg-accent/10 hover:text-accent-foreground',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]',
        gold: 'bg-gold text-white hover:bg-gold/90 active:scale-[0.98] shadow-lg shadow-gold/20',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 rounded-[--radius-sm] px-4 text-xs',
        lg: 'h-12 rounded-[--radius-md] px-8 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild && React.isValidElement(props.children)) {
      const child = props.children as React.ReactElement<Record<string, unknown>>;
      const childProps = child.props as Record<string, unknown>;
      const hasOnClick =
        typeof childProps.onClick === 'function' || typeof props.onClick === 'function';
      const combinedOnClick = hasOnClick
        ? (e: React.MouseEvent) => {
            if (typeof childProps.onClick === 'function') {
              (childProps.onClick as (e: React.MouseEvent) => void)(e);
            }
            if (typeof props.onClick === 'function') {
              (props.onClick as (e: React.MouseEvent<HTMLButtonElement>) => void)(
                e as unknown as React.MouseEvent<HTMLButtonElement>,
              );
            }
          }
        : undefined;

      return React.cloneElement(child, {
        ...props,
        ...childProps,
        className: cn(
          buttonVariants({ variant, size }),
          childProps.className as string | undefined,
          className,
        ),
        ...(hasOnClick ? { onClick: combinedOnClick } : {}),
        ref,
      });
    }

    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
