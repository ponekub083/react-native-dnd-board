import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import {
  PanGestureHandler,
  State,
  ScrollView,
} from 'react-native-gesture-handler';
import { TouchableWithoutFeedback, View } from 'react-native';
import Animated from 'react-native-reanimated';
import style from './style';
import Column from './components/column';
import Repository from './handlers/repository';
import Utils from './commons/utils';
import ColumnClone from './components/columnClone';

const { block, call, cond } = Animated;

const SCROLL_THRESHOLD = Utils.deviceWidth * 0.15;
const SCROLL_STEP_HORIZONTAL = Utils.deviceWidth * 0.1;
const SCROLL_STEP_VERTICAL = Utils.deviceWidth * 0.1;
const SCROLL_STEP = 8;

const DraggableBoard = ({
  repository,
  renderColumnWrapper,
  renderRow,
  columnWidth,
  accessoryRight,
  activeRowStyle,
  activeRowRotation = 8,
  activeColRotation = 0,
  xScrollThreshold = SCROLL_THRESHOLD,
  yScrollThreshold = SCROLL_THRESHOLD,
  dragSpeedFactor = 1,
  onRowPress = () => {},
  onColPress = () => {},
  onDragRowStart = () => {},
  onDragColStart = () => {},
  onDragEnd = () => {},
  delayDragRow = 1000,
  delayDragCol = 1000,
  style: boardStyle,
  horizontal = true,
}) => {
  const [forceUpdate, setForceUpdate] = useState(false);
  const [hoverComponent, setHoverComponent] = useState(null);
  const [isColunm, setIsColunm] = useState(false);
  const [movingMode, setMovingMode] = useState(false);

  let translateX = useRef(new Animated.Value(0)).current;
  let translateY = useRef(new Animated.Value(0)).current;

  let absoluteX = useRef(new Animated.Value(0)).current;
  let absoluteY = useRef(new Animated.Value(0)).current;

  const scrollViewRef = useRef();
  const scrollOffset = useRef(0);
  const hoverRowItem = useRef();
  const hoverColItem = useRef();

  useEffect(() => {
    repository.setReload(() => setForceUpdate((prevState) => !prevState));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPanGestureEvent = useMemo(
    () =>
      Animated.event(
        [
          {
            nativeEvent: {
              translationX: translateX,
              translationY: translateY,
              absoluteX,
              absoluteY,
            },
          },
        ],
        { useNativeDriver: true },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onHandlerStateChange = (event) => {
    switch (event.nativeEvent.state) {
      case State.CANCELLED:
      case State.END:
      case State.FAILED:
      case State.UNDETERMINED:
        if (movingMode) {
          translateX.setValue(0);
          translateY.setValue(0);

          absoluteX.setValue(0);
          absoluteY.setValue(0);

          setHoverComponent(null);
          setMovingMode(false);

          if (onDragEnd) {
            onDragEnd(
              isColunm
                ? hoverColItem.current.oldColumnIndex
                : hoverRowItem.current.oldColumnId,
              isColunm
                ? hoverColItem.current.columnIndex
                : hoverRowItem.current.columnId,
              isColunm ? hoverColItem.current : hoverRowItem.current,
            );

            repository.updateOriginalData();
          }

          if (isColunm) {
            repository.showCol(hoverColItem.current);
            hoverColItem.current = null;
          } else {
            repository.showRow(hoverRowItem.current);
            hoverRowItem.current = null;
          }
        }

        break;
    }
  };

  const listenRowChangeColumn = (fromColumnId, toColumnId) => {
    hoverRowItem.current.columnId = toColumnId;
    hoverRowItem.current.oldColumnId = fromColumnId;
  };

  const listenRowChange = (fromIndex, toIndex) => {
    hoverRowItem.current.rowIndex = toIndex;
    hoverRowItem.current.oldRowIndex = fromIndex;
  };

  const listenColumnChange = (fromColumnId, toColumnId) => {
    hoverColItem.current.columnIndex = toColumnId;
    hoverColItem.current.oldColumnIndex = fromColumnId;
  };

  const handleRowPosition = ([x, y]) => {
    if (hoverRowItem.current && (x || y) && !isColunm) {
      const columnAtPosition = repository.moveRow(
        hoverRowItem.current,
        x,
        y,
        listenRowChangeColumn,
        listenRowChange,
      );

      if (scrollViewRef.current) {
        // handle scroll horizontal

        if (x + xScrollThreshold > Utils.deviceWidth) {
          scrollOffset.current += SCROLL_STEP_HORIZONTAL;
          scrollViewRef.current.scrollTo({
            x: scrollOffset.current * dragSpeedFactor,
            y: 0,
            animated: true,
          });
          repository.measureColumnsLayout();
        } else if (x < xScrollThreshold) {
          scrollOffset.current -= SCROLL_STEP_HORIZONTAL;
          scrollViewRef.current.scrollTo({
            x: scrollOffset.current / dragSpeedFactor,
            y: 0,
            animated: true,
          });
          repository.measureColumnsLayout();
        }

        if (columnAtPosition) {
          // handle scroll inside item
          const {
            layout: { x: xx, y: yy, width, height },
          } = columnAtPosition;

          if (y > height - yy - yScrollThreshold) {
            columnAtPosition.scrollToDown(
              SCROLL_STEP_VERTICAL,
              dragSpeedFactor,
            );
            repository.measureColumnsLayout();
          } else if (y < yy + yScrollThreshold) {
            columnAtPosition.scrollToUp(SCROLL_STEP_VERTICAL, dragSpeedFactor);
            repository.measureColumnsLayout();
          }
        }
      }
    }
  };

  const handleColumnPosition = ([x, y]) => {
    //
    if (hoverColItem.current && (x || y) && isColunm) {
      const columnAtIndex = repository.moveCol(
        hoverColItem.current,
        x,
        y,
        listenColumnChange,
      );

      if (scrollViewRef.current) {
        // handle scroll horizontal

        if (x + xScrollThreshold > Utils.deviceWidth) {
          scrollOffset.current += SCROLL_STEP_HORIZONTAL;
          scrollViewRef.current.scrollTo({
            x: scrollOffset.current * dragSpeedFactor,
            y: 0,
            animated: true,
          });
          repository.measureColumnsLayout();
        } else if (x < xScrollThreshold) {
          scrollOffset.current -= SCROLL_STEP_HORIZONTAL;
          scrollViewRef.current.scrollTo({
            x: scrollOffset.current / dragSpeedFactor,
            y: 0,
            animated: true,
          });
          repository.measureColumnsLayout();
        }
      }
    }
  };

  const onScroll = (event) => {
    scrollOffset.current = event.nativeEvent.contentOffset.x;
  };

  const onScrollEnd = (event) => {
    scrollOffset.current = event.nativeEvent.contentOffset.x;
    repository.measureColumnsLayout();
  };

  const keyExtractor = useCallback(
    (item, index) => `${item.id}${item.name}${index}`,
    [],
  );

  const renderHoverComponent = () => {
    if (hoverComponent) {
      if (hoverRowItem.current) {
        const row = repository.findRow(hoverRowItem.current);

        if (row && row.layout) {
          const { x, y, width, height } = row.layout;
          const hoverStyle = [
            style.hoverComponent,
            activeRowStyle,
            {
              transform: [
                { translateX },
                { translateY },
                { rotate: `${activeRowRotation}deg` },
              ],
            },
            {
              top: y - yScrollThreshold,
              left: x,
              width: width,
              height,
            },
          ];

          return (
            <Animated.View style={hoverStyle}>{hoverComponent}</Animated.View>
          );
        }
      } else if (hoverColItem.current) {
        const col = hoverColItem.current;

        if (col && col.layout) {
          const { x, y, width, height } = col.layout;
          const hoverStyle = [
            style.hoverComponent,
            activeRowStyle,
            {
              transform: [
                { translateX },
                { translateY },
                { rotate: `${activeColRotation}deg` },
              ],
            },
            {
              top: y,
              left: x,
              width,
              height,
            },
          ];

          return (
            <Animated.View style={hoverStyle}>{hoverComponent}</Animated.View>
          );
        }
      }
    }
  };

  const moveItem = async (hoverItem, Item, isColumn = false) => {
    Item.setHidden(true);
    setIsColunm(isColumn);
    if (isColumn) {
      repository.hideCol(Item);
      await Item.measureLayout();
      hoverColItem.current = { ...Item };
    } else {
      repository.hideRow(Item);
      await Item.measureLayout();
      hoverRowItem.current = { ...Item };
    }
    setMovingMode(true);
    setHoverComponent(hoverItem);
  };

  const drag = (column) => {
    if (onDragColStart) {
      onDragColStart();
    }

    const key = keyExtractor(column, column.index);
    const columnComponent = (
      <ColumnClone
        // repository={}
        column={column}
        move={moveItem}
        renderColumnWrapper={renderColumnWrapper}
        keyExtractor={keyExtractor}
        renderRow={renderRow}
        scrollEnabled={false}
        columnWidth={columnWidth}
      />
    );

    const hoverComponent = renderColumnWrapper({
      move: moveItem,
      item: column.data,
      index: column.index,
      columnComponent,
      layoutProps: {
        key: `Clone-${key}`,
        // ref: (ref) => repository.updateColumnRef(column.id, ref),
        /// onLayout: (layout) => repository.updateColumnLayout(column.id),
      },
    });

    moveItem(hoverComponent, column, true);
  };

  const renderColumns = () => {
    const columns = repository.getColumns();
    return columns.map((column, index) => {
      const key = keyExtractor(column, index);
      const hidden = column.hidden ? style.invisible : style.visible;
      const columnComponent = (
        <Column
          repository={repository}
          column={column}
          move={moveItem}
          renderColumnWrapper={renderColumnWrapper}
          keyExtractor={keyExtractor}
          renderRow={renderRow}
          scrollEnabled={!movingMode}
          columnWidth={columnWidth}
          onRowPress={onRowPress}
          delayDrag={delayDragRow}
          onDragRowStartCallback={onDragRowStart}
        />
      );

      return (
        <TouchableWithoutFeedback
          key={`Col-${index}`}
          onLongPress={() => drag(column)}
          delayLongPress={delayDragCol}
          onPress={onColPress}
        >
          <Animated.View style={[hidden, style.container]}>
            {renderColumnWrapper({
              item: column.data,
              index: column.index,
              columnComponent,
              drag: () => drag(column),
              layoutProps: {
                key,
                ref: (ref) => repository.updateColumnRef(column.id, ref),
                onLayout: (layout) => repository.updateColumnLayout(column.id),
              },
            })}
          </Animated.View>
        </TouchableWithoutFeedback>
      );
    });
  };

  return (
    <PanGestureHandler
      onGestureEvent={onPanGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View style={[style.container, boardStyle]}>
        <ScrollView
          ref={scrollViewRef}
          scrollEnabled={!movingMode}
          horizontal={horizontal}
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          onScrollEndDrag={onScrollEnd}
          onMomentumScrollEnd={onScrollEnd}
        >
          {renderColumns()}

          <Animated.Code>
            {() =>
              block([
                cond(
                  movingMode,
                  call([absoluteX, absoluteY], handleRowPosition),
                ),
                cond(
                  movingMode,
                  call([absoluteX, absoluteY], handleColumnPosition),
                ),
              ])
            }
          </Animated.Code>

          {Utils.isFunction(accessoryRight) ? accessoryRight() : accessoryRight}
        </ScrollView>
        {renderHoverComponent()}
      </Animated.View>
    </PanGestureHandler>
  );
};

export default DraggableBoard;
export { Repository };
