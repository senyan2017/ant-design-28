import React from 'react';

import Input from '..';
import focusTest from '../../../tests/shared/focusTest';
import mountTest from '../../../tests/shared/mountTest';
import rtlTest from '../../../tests/shared/rtlTest';
import { createEvent, fireEvent, render, waitFakeTimer } from '../../../tests/utils';
import type { OTPProps } from '../OTP';

const { OTP } = Input;

describe('Input.OTP', () => {
  focusTest(Input.OTP, { refFocus: true });
  mountTest(Input.OTP);
  rtlTest(Input.OTP);

  const getText = (container: HTMLElement) => {
    const inputList = container.querySelectorAll<HTMLInputElement>('input');
    return Array.from(inputList)
      .map((input) => input.value || ' ')
      .join('')
      .replace(/\s*$/, '');
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('paste to fill all', async () => {
    const onChange = jest.fn();
    const { container } = render(<OTP onChange={onChange} />);

    fireEvent.input(container.querySelector('input')!, { target: { value: '123456' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('123456');
  });

  it('fill step by step', () => {
    const CODE = 'BAMBOO';
    const onChange = jest.fn();
    render(<OTP onChange={onChange} autoFocus />);

    for (let i = 0; i < CODE.length; i += 1) {
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.input(document.activeElement!, { target: { value: CODE[i] } });
    }

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(CODE);
  });

  it('backspace to delete', async () => {
    const CODE = 'LITTLE';

    const onChange = jest.fn();
    const { container } = render(<OTP defaultValue={CODE} onChange={onChange} />);
    expect(getText(container)).toBe(CODE);

    // Focus on the last cell
    const inputList = container.querySelectorAll('input');
    inputList[inputList.length - 1].focus();

    for (let i = 0; i < CODE.length; i += 1) {
      fireEvent.keyDown(document.activeElement!, { key: 'Backspace' });
      fireEvent.input(document.activeElement!, { target: { value: '' } });
      fireEvent.keyUp(document.activeElement!, { key: 'Backspace' });
    }

    expect(getText(container)).toBe('');

    // We do not trigger change if empty. It's safe to modify this logic if needed.
    expect(onChange).not.toHaveBeenCalled();
  });

  it('controlled', () => {
    const { container, rerender } = render(<OTP value="BAMBOO" />);
    expect(getText(container)).toBe('BAMBOO');

    rerender(<OTP value="LITTLE" />);
    expect(getText(container)).toBe('LITTLE');

    rerender(<OTP value="" />);
    expect(getText(container)).toBe('');

    rerender(<OTP value="EXCEED-RANGE" />);
    expect(getText(container)).toBe('EXCEED');

    rerender(<OTP value={null!} />);
    expect(getText(container)).toBe('');
  });

  it('focus to selection', async () => {
    const { container } = render(<OTP defaultValue="BAMBOO" />);

    const firstInput = container.querySelector('input')!;
    const selectSpy = jest.spyOn(firstInput, 'select');
    expect(selectSpy).not.toHaveBeenCalled();

    // Trigger focus
    firstInput.focus();
    await waitFakeTimer();

    expect(selectSpy).toHaveBeenCalled();
  });

  it('arrow key to switch', () => {
    const { container } = render(<OTP autoFocus defaultValue="12" />);

    const inputList = Array.from(container.querySelectorAll('input'));
    expect(document.activeElement).toEqual(inputList[0]);

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(document.activeElement).toEqual(inputList[1]);

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
    expect(document.activeElement).toEqual(inputList[0]);
  });

  it('should not switch to next input when value is empty', () => {
    const onFocus = jest.fn();
    const { container } = render(<OTP autoFocus onFocus={onFocus} />);

    const inputList = Array.from(container.querySelectorAll('input'));
    expect(document.activeElement).toEqual(inputList[0]);

    // Key operation
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(inputList[0]);

    // Focus directly
    fireEvent.focus(inputList[3]);
    expect(document.activeElement).toBe(inputList[0]);
  });

  it('fill last cell', () => {
    const { container } = render(<OTP />);
    fireEvent.input(container.querySelectorAll('input')[5], { target: { value: '1' } });

    expect(getText(container)).toBe('     1');
  });

  it('formatter', () => {
    const { container } = render(
      <OTP defaultValue="bamboo" formatter={(val) => val.toUpperCase()} />,
    );
    expect(getText(container)).toBe('BAMBOO');

    // Type to trigger formatter
    fireEvent.input(container.querySelector('input')!, { target: { value: 'little' } });
    expect(getText(container)).toBe('LITTLE');
  });

  it('support mask prop', () => {
    // default
    const { container, rerender } = render(<OTP defaultValue="bamboo" />);
    expect(getText(container)).toBe('bamboo');

    // support string
    rerender(<OTP defaultValue="bamboo" mask="*" />);
    expect(getText(container)).toBe('bamboo');

    // support emoji
    rerender(<OTP defaultValue="bamboo" mask="🔒" />);
    expect(getText(container)).toBe('bamboo');
  });

  it('should throw Error when mask.length > 1', () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<OTP mask="abc" />);
    expect(errSpy).toHaveBeenCalledWith(
      'Warning: [antd: Input.OTP] `mask` prop should be a single character.',
    );
    errSpy.mockRestore();
  });

  it('should not throw Error when mask.length <= 1', () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<OTP mask="x" />);
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('support type', () => {
    const { container } = render(<OTP type="number" />);
    expect(container.querySelector('input')).toHaveAttribute('type', 'number');
  });

  it('support autoComplete', () => {
    const { container } = render(<OTP autoComplete="one-time-code" />);
    const inputs = container.querySelectorAll('input');
    expect(inputs).toHaveLength(6);
    inputs.forEach((input) => {
      expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    });
  });

  it('should call onInput with a string array when input changes', () => {
    const onInput = jest.fn();
    const { container } = render(<OTP length={4} onInput={onInput} />);

    const inputs = Array.from(container.querySelectorAll('input'));

    fireEvent.input(inputs[0], { target: { value: '1' } });
    expect(onInput).toHaveBeenCalledWith(['1']);

    fireEvent.input(inputs[2], { target: { value: '3' } });
    expect(onInput).toHaveBeenCalledWith(['1', '', '3']);

    fireEvent.input(inputs[1], { target: { value: '2' } });
    expect(onInput).toHaveBeenCalledWith(['1', '2', '3']);

    fireEvent.input(inputs[3], { target: { value: '4' } });
    expect(onInput).toHaveBeenCalledWith(['1', '2', '3', '4']);
  });

  it('disabled ctrl + z', () => {
    const { container } = render(<OTP length={4} defaultValue="1234" />);
    const inputEle = container.querySelector('input')!;
    const event = createEvent.keyDown(inputEle, { key: 'z', ctrlKey: true });
    fireEvent(inputEle, event);

    expect(event.defaultPrevented).toBeTruthy();
  });

  it('renders separator between input fields', () => {
    const { container } = render(
      <OTP
        length={4}
        separator={(index) => (
          <span key={index} className="custom-separator">
            |
          </span>
        )}
      />,
    );
    const separators = container.querySelectorAll('.custom-separator');
    expect(separators.length).toBe(3);
    separators.forEach((separator) => {
      expect(separator.textContent).toBe('|');
    });
  });

  it('renders separator when separator is a string', () => {
    const { container } = render(<OTP length={4} separator="-" />);
    const separators = container.querySelectorAll(`.ant-otp-separator`);
    expect(separators.length).toBe(3);
    separators.forEach((separator) => {
      expect(separator.textContent).toBe('-');
    });
  });

  it('renders separator when separator is a element', () => {
    const customSeparator = <div data-testid="custom-separator">X</div>;
    const { getAllByTestId } = render(<OTP length={4} separator={customSeparator} />);
    const separators = getAllByTestId('custom-separator');
    expect(separators.length).toBe(3);
    separators.forEach((separator) => {
      expect(separator.textContent).toBe('X');
    });
  });

  it('support function classNames and styles', () => {
    const functionClassNames = (info: { props: OTPProps }) => {
      const { props } = info;
      const { disabled } = props;
      return {
        root: 'dynamic-root',
        input: disabled ? 'dynamic-input-disabled' : 'dynamic-input-enabled',
        separator: 'dynamic-separator',
      };
    };
    const functionStyles = (info: { props: OTPProps }) => {
      const { props } = info;
      const { disabled } = props;
      return {
        root: { color: 'rgb(255, 0, 0)' },
        input: { color: disabled ? 'rgb(0, 255, 0)' : 'rgb(255, 0, 0)' },
        separator: { color: 'rgb(0, 0, 255)' },
      };
    };
    const { container, rerender } = render(
      <OTP
        length={3}
        separator="-"
        classNames={functionClassNames}
        styles={functionStyles}
        disabled
      />,
    );
    const root = container.querySelector('.ant-otp');
    const input = container.querySelector('.ant-input');
    const separator = container.querySelector('.ant-otp-separator');

    expect(root).toHaveClass('dynamic-root');
    expect(input).toHaveClass('dynamic-input-disabled');
    expect(separator).toHaveClass('dynamic-separator');

    expect(root).toHaveStyle('color: rgb(255, 0, 0)');
    expect(input).toHaveStyle('color: rgb(0, 255, 0)');
    expect(separator).toHaveStyle('color: rgb(0, 0, 255)');

    const objectClassNames = {
      root: 'dynamic-root-default',
      input: 'dynamic-input-enabled',
      separator: 'dynamic-separator-default',
    };
    const objectStyles = {
      root: { color: 'rgb(0, 255, 0)' },
      input: { color: 'rgb(255, 0, 0)' },
      separator: { color: 'rgb(0, 0, 255)' },
    };

    rerender(<OTP length={4} separator="-" classNames={objectClassNames} styles={objectStyles} />);

    expect(root).toHaveClass('dynamic-root-default');
    expect(input).toHaveClass('dynamic-input-enabled');
    expect(separator).toHaveClass('dynamic-separator-default');
    expect(root).toHaveStyle('color: rgb(0, 255, 0)');
    expect(input).toHaveStyle('color: rgb(255, 0, 0)');
    expect(separator).toHaveStyle('color: rgb(0, 0, 255)');
  });

  describe('IME composition', () => {
    it('should not process intermediate composition input', () => {
      const onChange = jest.fn();
      const onInput = jest.fn();
      const { container } = render(<OTP length={4} onChange={onChange} onInput={onInput} />);

      const input = container.querySelector('input')!;

      // Start IME composition
      fireEvent.compositionStart(input);

      // Intermediate keystrokes during composition should be ignored
      fireEvent.input(input, { target: { value: 'n' } });
      fireEvent.input(input, { target: { value: 'ni' } });
      fireEvent.input(input, { target: { value: 'nih' } });

      expect(onChange).not.toHaveBeenCalled();
      expect(onInput).not.toHaveBeenCalled();

      // End composition with final character
      fireEvent.compositionEnd(input, { target: { value: '你' } });

      expect(onInput).toHaveBeenCalledTimes(1);
      expect(onInput).toHaveBeenCalledWith(['你']);
      expect(onChange).not.toHaveBeenCalled(); // Not all cells filled yet
    });

    it('should fill cells correctly after composition ends', () => {
      const onChange = jest.fn();
      const { container } = render(<OTP length={4} onChange={onChange} />);

      const inputs = container.querySelectorAll('input');

      // Compose first character
      fireEvent.compositionStart(inputs[0]);
      fireEvent.input(inputs[0], { target: { value: 'z' } });
      fireEvent.input(inputs[0], { target: { value: 'zh' } });
      fireEvent.compositionEnd(inputs[0], { target: { value: '中' } });

      // Compose second character
      fireEvent.compositionStart(inputs[1]);
      fireEvent.input(inputs[1], { target: { value: 'w' } });
      fireEvent.compositionEnd(inputs[1], { target: { value: '文' } });

      // Fill remaining cells with normal input
      fireEvent.input(inputs[2], { target: { value: 'A' } });
      fireEvent.input(inputs[3], { target: { value: 'B' } });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('中文AB');
    });

    it('should not switch cell via arrow keys during composition', () => {
      const { container } = render(<OTP length={4} autoFocus defaultValue="1234" />);

      const inputs = Array.from(container.querySelectorAll('input'));
      inputs[0].focus();
      expect(document.activeElement).toBe(inputs[0]);

      // Start composition
      fireEvent.compositionStart(inputs[0]);

      // Arrow keys during composition should NOT switch cells
      fireEvent.keyDown(inputs[0], { key: 'ArrowRight' });
      expect(document.activeElement).toBe(inputs[0]);

      // End composition
      fireEvent.compositionEnd(inputs[0], { target: { value: 'X' } });

      // Arrow keys should work again after composition ends
      fireEvent.keyDown(inputs[0], { key: 'ArrowRight' });
      expect(document.activeElement).toBe(inputs[1]);
    });

    it('should handle composition followed by normal input without duplicates', () => {
      const onChange = jest.fn();
      const { container } = render(<OTP length={4} onChange={onChange} />);

      const inputs = container.querySelectorAll('input');

      // Compose first cell
      fireEvent.compositionStart(inputs[0]);
      fireEvent.input(inputs[0], { target: { value: 'a' } });
      fireEvent.compositionEnd(inputs[0], { target: { value: '啊' } });

      // Normal input in subsequent cells
      fireEvent.input(inputs[1], { target: { value: 'B' } });
      fireEvent.input(inputs[2], { target: { value: 'C' } });
      fireEvent.input(inputs[3], { target: { value: 'D' } });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('啊BCD');
    });
  });
});
