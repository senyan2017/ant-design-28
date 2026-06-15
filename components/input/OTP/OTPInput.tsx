import * as React from 'react';
import { raf } from '@rc-component/util';
import { clsx } from 'clsx';

import { ConfigContext } from '../../config-provider';
import Input from '../Input';
import type { InputProps, InputRef } from '../Input';

export interface OTPInputProps extends Omit<InputProps, 'onChange'> {
  index: number;
  onChange: (index: number, value: string) => void;
  /** Tell parent to do active offset */
  onActiveChange: (nextIndex: number) => void;

  mask?: boolean | string;
}

const OTPInput = React.forwardRef<InputRef, OTPInputProps>((props, ref) => {
  const {
    className,
    value,
    onChange,
    onActiveChange,
    index,
    mask,
    onFocus,
    onCompositionStart,
    onCompositionEnd,
    ...restProps
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('otp');
  const maskValue = typeof mask === 'string' ? mask : value;

  // ========================== Ref ===========================
  const inputRef = React.useRef<InputRef>(null);

  React.useImperativeHandle(ref, () => inputRef.current!);

  // ====================== Composition =======================
  // Track IME composition so intermediate values (e.g. pinyin) are neither committed as cell
  // values nor used to advance the active cell. Only the final confirmed value is committed.
  const compositionRef = React.useRef(false);
  // Value committed on `compositionend`. Browsers disagree on event order: Chrome fires the
  // final `input` *before* `compositionend`, while Firefox emits an extra `input` *after* it.
  // We commit on `compositionend` (covers Chrome) and use this to drop the trailing Firefox
  // `input`, so a single composition never commits its value twice.
  const composingValueRef = React.useRef<string | null>(null);

  // ========================= Input ==========================
  const onInternalChange: React.InputEventHandler<HTMLInputElement> = (e) => {
    const nextValue = (e.target as HTMLInputElement).value;
    // Ignore intermediate states emitted while the IME is composing.
    if (compositionRef.current) {
      return;
    }
    // Drop the duplicated `input` some browsers emit right after `compositionend`.
    const isCompositionEcho = composingValueRef.current === nextValue;
    composingValueRef.current = null;
    if (isCompositionEcho) {
      return;
    }
    onChange(index, nextValue);
  };

  const onInternalCompositionStart: React.CompositionEventHandler<HTMLInputElement> = (e) => {
    compositionRef.current = true;
    onCompositionStart?.(e);
  };

  const onInternalCompositionEnd: React.CompositionEventHandler<HTMLInputElement> = (e) => {
    compositionRef.current = false;
    const nextValue = (e.currentTarget as HTMLInputElement).value;
    // Remember the committed value so the trailing `input` echo (see above) is ignored.
    composingValueRef.current = nextValue;
    onChange(index, nextValue);
    onCompositionEnd?.(e);
  };

  // ========================= Focus ==========================
  const syncSelection = () => {
    raf(() => {
      const inputEle = inputRef.current?.input;
      if (document.activeElement === inputEle && inputEle) {
        inputEle.select();
      }
    });
  };

  const onInternalFocus: React.FocusEventHandler<HTMLInputElement> = (e) => {
    onFocus?.(e);
    syncSelection();
  };

  // ======================== Keyboard ========================
  const onInternalKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    // While composing, keys belong to the IME (e.g. Backspace edits the buffer), so do not
    // hijack them for cell navigation.
    if (compositionRef.current) {
      return;
    }

    const { key, ctrlKey, metaKey } = event;

    if (key === 'ArrowLeft') {
      onActiveChange(index - 1);
    } else if (key === 'ArrowRight') {
      onActiveChange(index + 1);
    } else if (key === 'z' && (ctrlKey || metaKey)) {
      event.preventDefault();
    } else if (key === 'Backspace' && !value) {
      onActiveChange(index - 1);
    }

    syncSelection();
  };

  // ========================= Render =========================
  return (
    <span className={`${prefixCls}-input-wrapper`} role="presentation">
      {/* mask value */}
      {mask && value !== '' && value !== undefined && (
        <span className={`${prefixCls}-mask-icon`} aria-hidden="true">
          {maskValue}
        </span>
      )}

      <Input
        aria-label={`OTP Input ${index + 1}`}
        type={mask === true ? 'password' : 'text'}
        {...restProps}
        ref={inputRef}
        value={value}
        onInput={onInternalChange}
        onFocus={onInternalFocus}
        onKeyDown={onInternalKeyDown}
        onCompositionStart={onInternalCompositionStart}
        onCompositionEnd={onInternalCompositionEnd}
        onMouseDown={syncSelection}
        onMouseUp={syncSelection}
        className={clsx(className, { [`${prefixCls}-mask-input`]: mask })}
      />
    </span>
  );
});

export default OTPInput;
