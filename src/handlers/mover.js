import Utils from '../commons/utils';

export default class Mover {
  constructor() {
    this.THRESHOLD = 35;
    this.previous = {
      from: -1,
      to: -1,
    };
  }

  findColumnAtPosition = (columns, x, y) => {
    return columns.find((column) => {
      let layout = column.layout;

      if (!layout) {
        return false;
      }

      const left = x > layout.x;
      const right = x < layout.x + layout.width;
      const up = y > layout.y - this.THRESHOLD;
      const down = y < layout.y + layout.height + this.THRESHOLD;

      return layout && left && right && up && down;
    });
  };

  findColumnAtPositionV2 = (columns, x, y) => {
    return columns.find((column) => {
      let layout = column.layout;

      if (!layout) {
        return false;
      }

      const left = x > layout.x + this.THRESHOLD;
      const right = x < layout.x + layout.width - this.THRESHOLD;
      const up = y > layout.y;
      const down = y < layout.y + layout.height;

      return layout && left && right && up && down;
    });
  };

  selectItem = (x, y, draggedRow, item) => {
    const layout = item.layout;
    if (!layout || !draggedRow.layout) {
      return false;
    }

    const heightDiff = Math.abs(draggedRow.layout.height - layout.height);
    const left = x > layout.x;
    const right = x < layout.x + layout.width;
    let up, down;
    if (heightDiff > layout.height) {
      up = y > layout.y;
      down = y < layout.y + layout.height;
    } else {
      if (y < draggedRow.layout.y) {
        down = y < layout.y + layout.height - heightDiff;
        up = y > layout.y;
      } else {
        down = y < layout.y + layout.height;
        up = y > layout.y + heightDiff;
      }
    }
    return layout && left && right && up && down;
  };

  findRowAtPosition = (rows, x, y, draggedRow) => {
    let item = rows.find((i) => this.selectItem(x, y, draggedRow, i));

    let firstItem = rows[0];
    if (!item && firstItem && firstItem.layout && y <= firstItem.layout.y) {
      item = firstItem;
    }

    let lastItem = rows[rows.length - 1];
    if (!item && lastItem && lastItem.layout && y >= lastItem.layout.y) {
      item = lastItem;
    }

    return item;
  };

  moveColumn = (repository, col, fromColumnIndex, toColumnIndex) => {
    Object.keys(repository.columns).forEach((columnId) => {
      //
      const current = repository.columns[columnId].index;

      if (current > fromColumnIndex && current < toColumnIndex) {
        repository.columns[columnId].index -= 1;
      } else if (current < fromColumnIndex && current > toColumnIndex) {
        repository.columns[columnId].index += 1;
      } else if (current == toColumnIndex && current > fromColumnIndex) {
        // move to Rigth
        repository.columns[columnId].index -= 1;
      } else if (current == toColumnIndex && current < fromColumnIndex) {
        //  move to Left
        repository.columns[columnId].index += 1;
      } else if (current == fromColumnIndex) {
        repository.columns[columnId].index = toColumnIndex;
      }
    });

    if (Utils.isFunction(repository.reload)) {
      repository.reload();
    }
  };

  moveToOtherColumn = (repository, row, fromColumnId, toColumnId) => {
    repository.columns[fromColumnId].rows = repository.columns[
      fromColumnId
    ].rows.filter((item) => item.id !== row.id);

    repository.columns[fromColumnId].measureRowIndex();
    repository.columns[toColumnId].addRow(row);

    repository.notify(fromColumnId, 'reload');
    repository.notify(toColumnId, 'reload');
  };

  switchColumnItems = (firstItem, secondItem) => {
    if (!firstItem || !secondItem || !firstItem.layout || !secondItem.layout) {
      return;
    }

    const item = { ...firstItem };

    firstItem.setIndex(secondItem.index);

    secondItem.setIndex(item.index);
  };

  switchRowItems = (firstItem, secondItem) => {
    if (!firstItem || !secondItem || !firstItem.layout || !secondItem.layout) {
      return;
    }

    const item = { ...firstItem };

    firstItem.setRef(secondItem.ref);
    firstItem.setIndex(secondItem.index);
    firstItem.setId(secondItem.id);
    firstItem.setData(secondItem.data);
    firstItem.setHidden(secondItem.hidden);

    secondItem.setRef(item.ref);
    secondItem.setIndex(item.index);
    secondItem.setId(item.id);
    secondItem.setData(item.data);
    secondItem.setHidden(item.hidden);
  };

  switchItemsBetween = (
    repository,
    draggedRowIndex,
    rowAtPositionIndex,
    toColumnId,
  ) => {
    let rows = repository.columns[toColumnId].rows;
    if (draggedRowIndex > rowAtPositionIndex) {
      // Move up
      for (let i = draggedRowIndex - 1; i >= rowAtPositionIndex; i--) {
        this.switchRowItems(rows[i], rows[i + 1]);
      }
    } else {
      // Move down
      for (let i = draggedRowIndex; i < rowAtPositionIndex; i++) {
        this.switchRowItems(rows[i], rows[i + 1]);
      }
    }

    repository.columns[toColumnId].measureRowIndex();
    repository.notify(toColumnId, 'reload');
  };

  switchColumnItemsBetween = (
    repository,
    draggedColIndex,
    colAtPositionIndex,
  ) => {
    let columns = repository.getColumns();

    if (draggedColIndex > colAtPositionIndex) {
      // Move up
      for (let i = draggedColIndex - 1; i >= colAtPositionIndex; i--) {
        this.switchColumnItems(columns[i], columns[i + 1]);
      }
    } else {
      // Move down
      for (let i = draggedColIndex; i < colAtPositionIndex; i++) {
        this.switchColumnItems(columns[i], columns[i + 1]);
      }
    }

    repository.updateAllColumn(columns);
    repository.measureColumnsLayout();

    if (Utils.isFunction(repository.reload)) {
      repository.reload();
    }
  };
}
