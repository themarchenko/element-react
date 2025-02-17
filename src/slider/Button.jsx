/* @flow */

import React from 'react';
import { Component, PropTypes } from '../../libs';

import Tooltip from '../tooltip';

type State = {
  hovering: boolean,
  dragging: boolean,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  startPosition: number,
  newPosition: number
}

export default class SliderButton extends Component {
  state: State;

  static defaultProps = {
    value: 0
  }

  constructor(props: Object) {
    super(props);

    this.state = {
      hovering: false,
      dragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      startPosition: 0,
      newPosition: 0
    }
  }

  parent(): Component {
    return this.context.component;
  }

  handleMouseEnter(): void {
    this.setState({
      hovering: true
    });
  }

  handleMouseLeave(): void {
    this.setState({
      hovering: false
    });
  }

  onButtonDown(event: SyntheticMouseEvent<any>) {
    if (this.disabled()) return;

    this.onDragStart(event);

    window.addEventListener('mousemove', this.onDragging.bind(this));
    window.addEventListener('mouseup', this.onDragEnd.bind(this));
    window.addEventListener('contextmenu', this.onDragEnd.bind(this));
  }

  onDragStart(event: SyntheticMouseEvent<any>) {
    this.setState({
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      startPosition: parseInt(this.currentPosition(), 10)
    });
  }

  onDragging(event: SyntheticMouseEvent<any>) {
    const { dragging, startY, currentY, currentX, startX, startPosition, newPosition } = this.state;
    const { vertical } = this.props;
    if (dragging) {
      this.setState({
        currentX: event.clientX,
        currentY: event.clientY,
      }, () => {
        let diff;
        if (vertical) {
          diff = (startY - currentY) / this.parent().sliderSize() * 100;
        } else {
          diff = (currentX - startX) / this.parent().sliderSize() * 100;
        }
        this.state.newPosition = startPosition + diff;
        this.setPosition(newPosition);
      });
    }
  }

  onDragEnd() {
    const { dragging, newPosition } = this.state;
    if (dragging) {
      /*
       * 防止在 mouseup 后立即触发 click，导致滑块有几率产生一小段位移
       * 不使用 preventDefault 是因为 mouseup 和 click 没有注册在同一个 DOM 上
       */
      setTimeout(() => {
        this.setState({
          dragging: false
        }, () => {
          this.setPosition(newPosition);
        });
      }, 0);

      window.removeEventListener('mousemove', this.onDragging.bind(this));
      window.removeEventListener('mouseup', this.onDragEnd.bind(this));
      window.removeEventListener('contextmenu', this.onDragEnd.bind(this));
    }
  }

  setPosition(newPosition: number) {
    if (newPosition < 0) {
      newPosition = 0;
    } else if (newPosition > 100) {
      newPosition = 100;
    }

    const lengthPerStep = 100 / ((this.max() - this.min()) / this.step());
    const steps = Math.round(newPosition / lengthPerStep);
    const value = steps * lengthPerStep * (this.max() - this.min()) * 0.01 + this.min();

    this.props.onChange(parseFloat(value.toFixed(this.precision())));
  }

  /* Computed Methods */

  formatValue() {
    const { formatTooltip } = this.parent().props;

    if (formatTooltip instanceof Function) {
      return formatTooltip(this.props.value);
    }

    return this.props.value;
  }

  disabled(): boolean {
    return this.parent().props.disabled;
  }

  max(): number {
    return this.parent().props.max;
  }

  min(): number {
    return this.parent().props.min;
  }

  step(): number {
    return this.parent().props.step;
  }

  precision(): number {
    return this.parent().state.precision;
  }

  currentPosition(): string {
    return `${(this.props.value - this.min()) / (this.max() - this.min()) * 100}%`;
  }

  wrapperStyle(): Object {
    return this.props.vertical ? { bottom: this.currentPosition() } : { left: this.currentPosition() };
  }

  render(): React.ReactNode {
    const { hovering, dragging } = this.state;

    return (
      <div
        className={this.classNames('el-slider__button-wrapper', {
          'hover': hovering,
          'dragging': dragging
        })}
        style={this.wrapperStyle()}
        onMouseEnter={this.handleMouseEnter.bind(this)}
        onMouseLeave={this.handleMouseLeave.bind(this)}
        onMouseDown={this.onButtonDown.bind(this)}>
        <Tooltip
          placement="top"
          content={<span>{this.formatValue()}</span>}
          disabled={!this.parent().props.showTooltip}
        >
          <div
            className={this.classNames('el-slider__button', {
              'hover': hovering,
              'dragging': dragging
            })}
          />
        </Tooltip>
      </div>
    )
  }
}

SliderButton.contextTypes = {
  component: PropTypes.any
};

SliderButton.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.number,
  vertical: PropTypes.bool
};
