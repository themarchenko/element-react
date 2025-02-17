// @flow
import * as React from 'react';
import type { _Column } from "./Types";

const _document = ((typeof document === 'object' ? document : {}): any);

let scrollBarWidth: ?number;

export const cleanScrollBar = () => {
  document.querySelectorAll('.el-table__body-wrapper').forEach(el => {
    setTimeout(() => {
      el.style.overflow = 'hidden';
      setTimeout(() => el.style.overflow = 'auto');
    });
  });
};

export function getScrollBarWidth(): ?number {
  if (scrollBarWidth !== undefined) return scrollBarWidth;
  const dom = _document.createElement('div');
  const body = _document.body || dom;

  dom.style.visibility = 'hidden';
  dom.style.width = '100px';
  dom.style.position = 'absolute';
  dom.style.top = '-9999px';
  dom.style.overflow = 'scroll';

  body.appendChild(dom);

  const totalWidth = dom.offsetWidth;
  const widthWithoutScroll = dom.clientWidth;

  body.removeChild(dom);

  return totalWidth - widthWithoutScroll;
}

export function getValueByPath(data: Object, path: ?string): any {
  if (typeof path !== 'string') return null;
  return path.split('.').reduce((pre: Object, cur) => (pre || {})[cur], data);
}

export function getRowIdentity(row: Object, rowKey: any): any {
  if (typeof rowKey === 'string') {
    return getValueByPath(row, rowKey);
  } else if (typeof rowKey === 'function') {
    return rowKey(row);
  }
}

export function getLeafColumns(columns: Array<_Column>): Array<_Column> {
  const result = [];
  columns.forEach((column) => {
    if (column.subColumns) {
      result.push(...getLeafColumns(column.subColumns));
    } else {
      result.push(column);
    }
  });
  return result;
}

function convertChildrenToColumns(children: Array<Object> | Object) {
  return React.Children.map(children, (child) => {
    if (child.type.typeName !== 'TableColumn') {
      console.warn(`Table component's children must be TableColumn, but received ${child.type}`);
      return {};
    }

    const column = Object.assign({}, child.props);
    if (column.children) {
      column.subColumns = convertChildrenToColumns(column.children);
      delete column.children;
    }
    return column;
  })
}

export function getColumns(props: Object) {
  return props.children ? convertChildrenToColumns(props.children) : props.columns || [];
}

export function convertToRows(columns: Array<_Column>): Array<Array<_Column>> {
  let maxLevel = 1;

  function traverse(column: _Column, parent: ?_Column) {
    if (parent) {
      column.level = parent.level + 1;
      if (maxLevel < column.level) {
        maxLevel = column.level;
      }
    } else {
      column.level = 1;
    }

    if (column.subColumns) {
      let colSpan = 0;
      column.subColumns.forEach((subColumn) => {
        traverse(subColumn, column);
        colSpan += subColumn.colSpan;
      });
      column.colSpan = colSpan;
    } else {
      column.colSpan = 1;
    }
  }

  columns.forEach((column) => {
    traverse(column);
  });

  const rows = [];
  for (let i = 0; i < maxLevel; i++) {
    rows.push([]);
  }

  const allColumns = [];
  const queue = columns.slice();
  for (let i = 0; queue[i]; i++) {
    allColumns.push(queue[i]);
    if (queue[i].subColumns) queue.push(...queue[i].subColumns);
  }

  allColumns.forEach((column) => {
    if (!column.subColumns) {
      column.rowSpan = maxLevel - column.level + 1;
    } else {
      column.rowSpan = 1;
    }
    rows[column.level - 1].push(column);
  });
  return rows;
}

const checkType = (data: any): string => Object.prototype.toString.call(data).toLowerCase().slice(8, -1);

const deepCompare = (obj1: any, obj2: any): boolean => {
    const obj1Type = checkType(obj1);
    const obj2Type = checkType(obj2);
    if (obj1Type !== obj2Type ) return false;
  
    if (obj1Type === 'array' && obj1.length === obj2.length) {
        return obj1.every((value, key) => (
            deepCompare(value, obj2[key])
        ))
    } 
  
    if (obj1Type === 'object') {
        for (let key in obj1) {
            if (!Object.keys(obj2).includes(key)) return false;
            return deepCompare(obj1[key], obj2[key])
        }
        return false
    }
    return Object.is(obj1,obj2);
}

export {
  deepCompare,
  checkType,
}
