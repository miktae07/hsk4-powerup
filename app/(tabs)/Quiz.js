import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, TouchableHighlight, TouchableOpacity, Platform, Dimensions } from 'react-native';
import MultipleChoiceQuiz from './widgets/MultipleChoiceQuiz';
import TypingQuiz from './widgets/TypingQuiz';
import { useStore } from './store.js';

const Quiz = () => {
  const q = useStore(state => state.q);
  const clearQ = useStore(state => state.clearQ);
  const score = useStore(state => state.score);
  const killScore = useStore(state => state.killScore);

  useEffect(() => { }, [0])

  useEffect(() => { console.log('q: ', q) }, [q])

  if (q >= 10) {
    return (
      <View >
        <Text style={styles.congratText}>Congratulation!
          You have scored {score} out of 10.</Text>
      </View>
    );
  }

  return (
    <View>
      {
        q % 2 == 0 ?
          <MultipleChoiceQuiz />
          : <TypingQuiz />
      }
    </View>
  );
};

const styles = StyleSheet.create({
  congratText: {
    fontSize: 20,
  },
});

export default Quiz;