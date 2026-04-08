"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type OptionItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

type OptionElementProps = {
  value?: string | number;
  disabled?: boolean;
  children?: React.ReactNode;
};

type RadixOptionItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

const EMPTY_OPTION_TOKEN = "__select_empty_option__";

function extractOptions(children: React.ReactNode): OptionItem[] {
  const options: OptionItem[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      return;
    }

    const element = child as React.ReactElement<OptionElementProps>;

    if (element.type === React.Fragment) {
      options.push(...extractOptions(element.props.children));
      return;
    }

    if (typeof element.type === "string" && element.type.toLowerCase() === "option") {
      const value = element.props.value == null ? "" : String(element.props.value);
      const label = typeof element.props.children === "string" ? element.props.children : String(element.props.children ?? "");

      options.push({
        value,
        label,
        disabled: Boolean(element.props.disabled)
      });
    }
  });

  return options;
}

export type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> & {
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      children,
      value,
      defaultValue,
      onChange,
      onValueChange,
      onBlur,
      name,
      disabled,
      required,
      placeholder,
      id,
      ...props
    },
    ref
  ) => {
    const options = React.useMemo(() => extractOptions(children), [children]);
    const emptyOption = options.find((item) => item.value === "");
    const placeholderLabel = placeholder ?? emptyOption?.label ?? "Select";

    const radixItems = React.useMemo<RadixOptionItem[]>(() => {
      const nonEmptyItems = options.filter((item) => item.value !== "");

      if (!emptyOption) {
        return nonEmptyItems;
      }

      return [
        {
          value: EMPTY_OPTION_TOKEN,
          label: emptyOption.label,
          disabled: emptyOption.disabled
        },
        ...nonEmptyItems
      ];
    }, [emptyOption, options]);

    const controlled = value !== undefined;
    const normalizedDefault = defaultValue == null ? "" : String(defaultValue);
    const [internalValue, setInternalValue] = React.useState(normalizedDefault);

    React.useEffect(() => {
      if (!controlled) {
        setInternalValue(normalizedDefault);
      }
    }, [controlled, normalizedDefault]);

    const selectedValue = controlled ? String(value ?? "") : internalValue;
    const radixValue = selectedValue === "" ? (emptyOption ? EMPTY_OPTION_TOKEN : undefined) : selectedValue;

    const emitChange = (nextValue: string) => {
      const resolvedValue = nextValue === EMPTY_OPTION_TOKEN ? "" : nextValue;

      if (!controlled) {
        setInternalValue(resolvedValue);
      }

      onValueChange?.(resolvedValue);

      if (onChange) {
        const syntheticEvent = {
          target: { name, value: resolvedValue },
          currentTarget: { name, value: resolvedValue }
        } as unknown as React.ChangeEvent<HTMLSelectElement>;

        onChange(syntheticEvent);
      }
    };

    return (
      <div className="relative">
        <select
          aria-hidden
          className="sr-only"
          disabled={disabled}
          id={id ? `${id}-native` : undefined}
          name={name}
          onBlur={onBlur}
          onChange={(event) => emitChange(event.target.value)}
          ref={ref}
          required={required}
          tabIndex={-1}
          value={selectedValue}
          {...props}
        >
          {children}
        </select>

        <SelectPrimitive.Root disabled={disabled} onValueChange={emitChange} value={radixValue}>
          <SelectPrimitive.Trigger
            suppressHydrationWarning
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-[#d6d9fc] bg-[#f6f9fc] px-3 py-2 text-sm text-[#061b31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            id={id}
          >
            <SelectPrimitive.Value placeholder={placeholderLabel} />
            <SelectPrimitive.Icon>
              <ChevronsUpDown className="h-4 w-4 opacity-60" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              className="z-50 overflow-hidden rounded-md border border-[#d6d9fc] bg-white text-[#061b31] shadow-lg"
              position="popper"
            >
              <SelectPrimitive.Viewport className="p-1">
                {radixItems.map((item) => (
                  <SelectPrimitive.Item
                    className="relative flex cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none focus:bg-[#eef4ff] data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    disabled={item.disabled}
                    key={item.value}
                    value={item.value}
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Check className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>{item.label}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
