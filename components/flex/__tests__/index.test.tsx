import React from 'react';

import Flex from '..';
import mountTest from '../../../tests/shared/mountTest';
import rtlTest from '../../../tests/shared/rtlTest';
import { render } from '../../../tests/utils';

const FunCom = React.forwardRef<HTMLDivElement, { className?: string }>((props, ref) => (
  <div className={props.className} ref={ref}>
    test FC
  </div>
));

class ClassCom extends React.PureComponent<{ className?: string }> {
  render() {
    return <div className={this.props.className}>test Class</div>;
  }
}

describe('Flex', () => {
  mountTest(() => (
    <Flex>
      <div>test1</div>
      <div>test2</div>
    </Flex>
  ));
  rtlTest(() => (
    <Flex>
      <div>test1</div>
      <div>test2</div>
    </Flex>
  ));
  it('Flex', () => {
    const { container, rerender } = render(<Flex justify="center">test</Flex>);
    expect(container.querySelector('.ant-flex')).toHaveStyle({ justifyContent: 'center' });
    rerender(<Flex flex="0 1 auto">test</Flex>);
    expect(container.querySelector('.ant-flex')).toHaveStyle({ flex: '0 1 auto' });
  });

  describe('Props: gap', () => {
    it('support string', () => {
      const { container } = render(<Flex id="flex-inherit" gap="inherit" />);

      expect(container.querySelector('#flex-inherit')).toHaveStyle({
        gap: 'inherit',
      });
    });

    it('support number', () => {
      const { container } = render(<Flex gap={100} />);

      expect(container.querySelector('.ant-flex')).toHaveStyle({
        gap: '100px',
      });
    });

    it('support preset size', () => {
      const { container } = render(<Flex gap="small" />);

      expect(container.querySelector('.ant-flex')).toHaveClass('ant-flex-gap-small');
    });
  });

  it('Component work', () => {
    const testFcRef = React.createRef<HTMLDivElement>();
    const testClsRef = React.createRef<ClassCom>();
    const { container, rerender } = render(<Flex>test</Flex>);
    expect(container.querySelector<HTMLDivElement>('.ant-flex')?.tagName).toBe('DIV');
    rerender(<Flex component="span">test</Flex>);
    expect(container.querySelector<HTMLSpanElement>('.ant-flex')?.tagName).toBe('SPAN');
    rerender(<Flex component={(props) => <FunCom {...props} ref={testFcRef} />}>test</Flex>);
    expect(container.querySelector<HTMLDivElement>('.ant-flex')?.textContent).toBe('test FC');
    expect(testFcRef.current).toBeTruthy();
    rerender(<Flex component={(props) => <ClassCom {...props} ref={testClsRef} />}>test</Flex>);
    expect(container.querySelector<HTMLDivElement>('.ant-flex')?.textContent).toBe('test Class');
    expect(testClsRef.current).toBeTruthy();
  });

  it('when vertical=true should stretch work', () => {
    const { container, rerender } = render(<Flex vertical>test</Flex>);
    expect(container.querySelector<HTMLDivElement>('.ant-flex')).toHaveClass(
      'ant-flex-align-stretch',
    );
    rerender(
      <Flex vertical align="center">
        test
      </Flex>,
    );
    expect(container.querySelector<HTMLDivElement>('.ant-flex')).toHaveClass(
      'ant-flex-align-center',
    );
  });

  it('wrap prop shouled support boolean', () => {
    const { container, rerender } = render(<Flex>test</Flex>);
    const element = container.querySelector<HTMLDivElement>('.ant-flex');

    ([true, 'wrap'] as const).forEach((value) => {
      rerender(<Flex wrap={value}>test</Flex>);
      expect(element).toHaveClass('ant-flex-wrap-wrap');
    });

    ([false, 'nowrap'] as const).forEach((value) => {
      rerender(<Flex wrap={value}>test</Flex>);
      expect(element).not.toHaveClass('ant-flex-wrap-wrap');
    });
  });

  // ============================= orientation =============================
  describe('orientation attribute', () => {
    it('vertical=true orientation=horizontal, result orientation=horizontal', () => {
      const { container } = render(
        <Flex vertical orientation="horizontal">
          test
        </Flex>,
      );
      expect(container.querySelector<HTMLDivElement>('.ant-flex-vertical')).toBeNull();
    });

    it('orientation=vertical, result orientation=vertical', () => {
      const { container } = render(<Flex orientation="vertical">test</Flex>);
      expect(container.querySelector<HTMLDivElement>('.ant-flex-vertical')).not.toBeNull();
    });
  });

  // ============================= separator =============================
  describe('separator', () => {
    it('should render separators between children', () => {
      const { container } = render(
        <Flex separator="|">
          <span>A</span>
          <span>B</span>
          <span>C</span>
        </Flex>,
      );
      const separators = container.querySelectorAll('.ant-flex-separator');
      expect(separators).toHaveLength(2);
      expect(separators[0]).toHaveTextContent('|');
      expect(separators[1]).toHaveTextContent('|');
    });

    it('should not render separator when only one child', () => {
      const { container } = render(
        <Flex separator="|">
          <span>A</span>
        </Flex>,
      );
      expect(container.querySelectorAll('.ant-flex-separator')).toHaveLength(0);
    });

    it('should not render separator when no children', () => {
      const { container } = render(<Flex separator="|" />);
      expect(container.querySelectorAll('.ant-flex-separator')).toHaveLength(0);
    });

    it('should skip null, undefined, false and empty string children', () => {
      const { container } = render(
        <Flex separator="|">
          <span>A</span>
          {null}
          {undefined}
          {false}
          {''}
          <span>B</span>
        </Flex>,
      );
      const separators = container.querySelectorAll('.ant-flex-separator');
      expect(separators).toHaveLength(1);
    });

    it('should support ReactNode as separator', () => {
      const { container } = render(
        <Flex separator={<span data-testid="custom-sep">•</span>}>
          <span>A</span>
          <span>B</span>
        </Flex>,
      );
      expect(container.querySelector('[data-testid="custom-sep"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="custom-sep"]')?.textContent).toBe('•');
    });

    it('should support function as separator with index', () => {
      const separatorFn = jest.fn((index: number) => <span>{`sep-${index}`}</span>);
      const { container } = render(
        <Flex separator={separatorFn}>
          <span>A</span>
          <span>B</span>
          <span>C</span>
        </Flex>,
      );
      expect(separatorFn).toHaveBeenCalledTimes(2);
      expect(separatorFn).toHaveBeenCalledWith(0);
      expect(separatorFn).toHaveBeenCalledWith(1);
      const separators = container.querySelectorAll('.ant-flex-separator');
      expect(separators).toHaveLength(2);
      expect(separators[0]).toHaveTextContent('sep-0');
      expect(separators[1]).toHaveTextContent('sep-1');
    });

    it('should work with vertical direction', () => {
      const { container } = render(
        <Flex vertical separator="—">
          <span>A</span>
          <span>B</span>
        </Flex>,
      );
      expect(container.querySelector('.ant-flex-vertical')).toBeTruthy();
      expect(container.querySelectorAll('.ant-flex-separator')).toHaveLength(1);
    });

    it('should work with gap and wrap', () => {
      const { container } = render(
        <Flex gap="small" wrap separator="|">
          <span>A</span>
          <span>B</span>
          <span>C</span>
        </Flex>,
      );
      const flexEl = container.querySelector('.ant-flex');
      expect(flexEl).toHaveClass('ant-flex-gap-small');
      expect(flexEl).toHaveClass('ant-flex-wrap-wrap');
      expect(container.querySelectorAll('.ant-flex-separator')).toHaveLength(2);
    });

    it('should not affect existing className and style', () => {
      const { container } = render(
        <Flex className="custom-cls" style={{ color: 'red' }} separator="|">
          <span>A</span>
          <span>B</span>
        </Flex>,
      );
      const flexEl = container.querySelector('.ant-flex');
      expect(flexEl).toHaveClass('custom-cls');
      expect(flexEl).toHaveStyle({ color: 'red' });
    });

    it('should not insert separators when separator prop is not provided', () => {
      const { container } = render(
        <Flex>
          <span>A</span>
          <span>B</span>
          <span>C</span>
        </Flex>,
      );
      expect(container.querySelectorAll('.ant-flex-separator')).toHaveLength(0);
    });
  });
});
