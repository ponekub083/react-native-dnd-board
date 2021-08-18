import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TouchableWithoutFeedback, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import style from '../style';
import Row from './row';

const Column = ({
  repository,
  move,
  column,
  keyExtractor,
  renderRow,
  scrollEnabled,
  columnWidth,
  onDragStartCallback,
  onRowPress = () => {},
  delayDrag = 1000,
}) => {
  const [rows, setRows] = useState(column.rows);

  const verticalOffset = useRef(0);
  const columnRef = useRef();

  const onScroll = useCallback((event) => {
    column.setVerticalOffset(event.nativeEvent.contentOffset.x);
  }, []);

  const onScrollEnd = useCallback(
    (event) => {
      column.setVerticalOffset(event.nativeEvent.contentOffset.x);
      column.measureRowLayout();
    },
    [column],
  );

  const renderRowItem = ({ item, index }) => {
    return (
      <View
        ref={(ref) => repository.updateRowRef(column.id, item.id, ref)}
        onLayout={(layout) => repository.updateRowLayout(column.id, item.id)}
      >
        <Row
          row={item}
          move={move}
          renderItem={renderRow}
          hidden={item.hidden}
          onPress={() => onRowPress(item)}
          delayDrag={delayDrag}
          onDragStartCallback={onDragStartCallback}
        />
      </View>
    );
  };

  const reload = () => {
    const items = repository.getRowsByColumnId(column.id);

    // console.log('Column reload : ', { id: column.id, items });
    setRows([...items]);
  };

  useEffect(() => {
    // console.log('Column useEffect : ', column.id);

    const unsubscribe = repository.addListener(column.id, 'reload', reload);
    return () => {
      unsubscribe;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setRows(column.rows);
  }, [column.id, column.index, column.rows.length, repository]);

  const setRef = (ref) => {
    columnRef.current = ref;
    repository.setColumnScrollRef(column.id, columnRef.current);
  };

  return (
    <View style={{ minWidth: columnWidth, width: columnWidth }}>
      <FlatList
        ref={setRef}
        data={rows}
        extraData={[rows, rows.length, column.rows]}
        renderItem={renderRowItem}
        keyExtractor={keyExtractor}
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        onScroll={onScroll}
        onScrollEndDrag={onScrollEnd}
        onMomentumScrollEnd={onScrollEnd}
      />
    </View>
  );
};

export default Column;
