import { useStore } from '@/hooks/useStore';
import GrammarQuiz from '@components/ui/GrammarQuiz.js';
import MultipleChoiceQuiz from '@components/ui/MultipleChoiceQuiz.js';
import ProgressBar from '@components/ui/ProgressBar.js';
import TypingQuiz from '@components/ui/TypingQuiz.js';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av';

const TOTAL_QUESTIONS = 10;

const Quiz = () => {
  const q = useStore(state => state.q);
  const score = useStore(state => state.score);

  // Reset quiz state on mount
  const clearQ = useStore(state => state.clearQ);
  const killScore = useStore(state => state.killScore);
  useEffect(() => {
    killScore();
    clearQ();
  }, [killScore, clearQ]);

  // audio state: play once when quiz completes
  const [playedEndSound, setPlayedEndSound] = useState(false);
  const [sound, setSound] = useState(null);

  // Play completion sound once when q reaches or exceeds TOTAL_QUESTIONS
  useEffect(() => {
    let cancelled = false;
    const playCompletion = async () => {
      if (q >= TOTAL_QUESTIONS && !playedEndSound) {
        try {
          // change path if you have a dedicated 'complete' sound; reuse correct.mp3 if not
          const { sound: newSound } = await Audio.Sound.createAsync(
            require('@assets/audio/correct.mp3'),
            { shouldPlay: true }
          );
          if (cancelled) {
            // if component unmounted before play finished, cleanup
            await newSound.unloadAsync();
            return;
          }
          setSound(newSound);
          setPlayedEndSound(true);
        } catch (err) {
          console.log('Error playing completion sound:', err);
        }
      }
    };

    playCompletion();

    return () => {
      cancelled = true;
    };
  }, [q, playedEndSound]);

  // cleanup sound on unmount or when sound changes
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  if (q >= TOTAL_QUESTIONS) {
    return (
      <View style={styles.container}>
        <Text style={styles.congratText}>
          Congratulation! You have scored {score} out of {TOTAL_QUESTIONS}.
        </Text>
      </View>
    );
  }

  const renderQuizType = () => {
    const type = q % 3;
    switch (type) {
      case 0:
        return <MultipleChoiceQuiz />;
      case 1:
        return <TypingQuiz />;
      case 2:
        return <GrammarQuiz />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionCounter}>Question {q + 1} / {TOTAL_QUESTIONS}</Text>
      <ProgressBar progress={(q + 1) / TOTAL_QUESTIONS} />
      {renderQuizType()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  questionCounter: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  congratText: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 50,
  },
});

export default Quiz;
