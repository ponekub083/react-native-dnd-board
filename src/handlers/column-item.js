export default class Column {
  constructor({
    ref,
    scrollRef,
    layout,
    id,
    index,
    data,
    rows,
    verticalOffset = { x: 0, y: 0 },
  }) {
    this.ref = ref;
    this.scrollRef = scrollRef;
    this.verticalOffset = verticalOffset;
    this.layout = layout;
    this.id = id;
    this.index = index;
    this.data = data;
    this.rows = rows;
    this.hidden = false;
  }

  getAttributes = () => {
    return {
      ref: this.ref,
      scrollRef: this.scrollRef,
      verticalOffset: this.verticalOffset,
      layout: this.layout,
      id: this.id,
      index: this.index,
      data: this.data,
      rows: this.rows,
      hidden: this.hidden,
    };
  };

  setId = (id) => {
    this.id = id;
    this.rows.forEach((row, index) => {
      row.setColumnId(id);
    });
  };

  setRef = (ref) => {
    this.ref = ref;
  };

  setIndex = (index) => {
    this.index = index;
  };

  setLayout = (layout) => {
    this.layout = layout;
  };

  setRows = (rows) => {
    this.rows = rows;
  };

  setData = (data) => {
    this.data = data;
  };

  setHidden = (hidden) => {
    this.hidden = hidden;
  };

  setVerticalOffset = (verticalOffset) => {
    this.verticalOffset = verticalOffset;
  };

  setScrollRef = (scrollRef) => {
    this.scrollRef = scrollRef;
  };

  scrollOffset = (offset) => {
    if (this.scrollRef) {
      this.scrollRef.scrollToOffset({ offset: offset });
    }
  };

  scrollToUp = (SCROLL_STEP, dragSpeedFactor) => {
    if (this.scrollRef) {
      this.verticalOffset -= SCROLL_STEP;
      this.scrollRef.scrollToOffset({
        offset: this.verticalOffset / dragSpeedFactor,
        animated: true,
      });
    }
  };

  scrollToDown = (SCROLL_STEP, dragSpeedFactor) => {
    if (this.scrollRef) {
      this.verticalOffset += SCROLL_STEP;
      this.scrollRef.scrollToOffset({
        offset: this.verticalOffset * dragSpeedFactor,
        animated: true,
      });
    }
  };

  addRow = (row) => {
    row.columnId = this.id;
    row.setIndex(this.rows.length);
    this.rows.push(row);
  };

  measureRowIndex = () => {
    this.rows.forEach((row, index) => {
      row.setIndex(index);
    });
  };

  measureRowLayout = (scrollOffsetX) => {
    this.rows.forEach((row) => {
      if (row.measureLayout) {
        row.measureLayout(scrollOffsetX);
      }
    });
  };

  measureLayout = (scrollOffsetX) => {
    if (this.ref && this.ref.measure) {
      this.ref.measure((fx, fy, width, height, px, py) => {
        if (scrollOffsetX) {
          px += scrollOffsetX;
        }
        const layout = { x: px, y: py, width, height };
        this.setLayout(layout);

        this.measureRowLayout(scrollOffsetX);
      });
    }
  };
}
