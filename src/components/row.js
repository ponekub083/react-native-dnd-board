import React, { memo } from 'react';
import { TouchableWithoutFeedback, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import style from '../style';

const Row = memo(
  ({
    row,
    move,
    renderItem,
    hidden,
    onPress,
    delayDrag = 1000,
    onDragStartCallback,
  }) => {
    const onDragBegin = () => {
      if (onDragStartCallback) {
        onDragStartCallback();
      }
      const hoverComponent = renderItem({
        move,
        item: row.data,
        index: row.index,
      });
      move(hoverComponent, row);
    };

    const component = renderItem({
      move,
      item: row.data,
      index: row.index,
    });

    return (
      <TouchableWithoutFeedback
        onLongPress={onDragBegin}
        delayLongPress={delayDrag}
        onPress={onPress}
      >
        <Animated.View style={hidden ? style.invisible : style.visible}>
          {component}
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  },
);

export default Row;
