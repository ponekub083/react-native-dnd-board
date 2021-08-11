import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TouchableWithoutFeedback, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import style from '../style';
import Row from './row';

const ColumnClone = ({
  move,
  column,
  keyExtractor,
  renderRow,
  scrollEnabled,
  columnWidth,
  onDragStartCallback,
  onRowPress = () => {},
}) => {
  const [rows, setRows] = useState(column.rows);

  const renderRowItem = ({ item, index }) => {
    return (
      <View>
        <Row
          row={item}
          move={move}
          renderItem={renderRow}
          hidden={item.hidden}
          onPress={() => onRowPress(item)}
          onDragStartCallback={onDragStartCallback}
        />
      </View>
    );
  };

  useEffect(() => {
    setRows(column.rows);
  }, [column.id, column.index, column.rows.length]);

  return (
    <View style={{ width: columnWidth }}>
      <FlatList
        data={rows}
        extraData={[rows, rows.length, column.rows]}
        renderItem={renderRowItem}
        keyExtractor={keyExtractor}
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      />
    </View>
  );
};

export default ColumnClone;
