import { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MultipleChoiceQuiz from '@components/ui/MultipleChoiceQuiz.js';
import TypingQuiz from '@components/ui/TypingQuiz.js';
import { useStore } from '@app/store.js';

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